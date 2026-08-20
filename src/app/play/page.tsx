"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./play.module.css";

const GAME_TIME_MS = 60000;

interface QuestionData {
  questionId: number;
  imageUrl: string;
  options: string[];
}

interface AttemptHistoryItem {
  questionId: number;
  imageUrl: string;
  selectedOption: string;
  isCorrect: boolean;
  correctAnswer?: string;
}

export default function Play() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");

  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [nextQuestion, setNextQuestion] = useState<QuestionData | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [questionCount, setQuestionCount] = useState(1);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);

  const [timeLeft, setTimeLeft] = useState(GAME_TIME_MS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryItem[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);
  const seenIdsRef = useRef<number[]>([]);
  const isFetchingBufferRef = useRef<boolean>(false);

  // Preload an image into browser memory so rendering is instant
  const preloadImage = (url: string) => {
    if (typeof window !== "undefined") {
      const img = new Image();
      img.src = url;
    }
  };

  // Fetch question from server helper
  const fetchQuestionData = async (excludeIds: number[], uid: string): Promise<QuestionData | null | "GAMEOVER"> => {
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludeIds, userId: uid }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.gameOver) return "GAMEOVER";
      if (data.imageUrl) preloadImage(data.imageUrl);
      return data;
    } catch (err) {
      console.error("Error fetching question:", err);
      return null;
    }
  };

  // Prefetch buffer question in background
  const fillBufferQuestion = useCallback(async (currentSeenIds: number[], uid: string) => {
    if (isFetchingBufferRef.current) return;
    isFetchingBufferRef.current = true;
    const qData = await fetchQuestionData(currentSeenIds, uid);
    if (qData && qData !== "GAMEOVER") {
      setNextQuestion(qData);
    }
    isFetchingBufferRef.current = false;
  }, []);

  // Initial load
  useEffect(() => {
    const storedId = localStorage.getItem("logo_guesser_user_id");
    const storedName = localStorage.getItem("logo_guesser_name") || "";
    if (!storedId) {
      router.push("/");
    } else {
      setUserId(storedId);
      setUserName(storedName);

      // Fetch first question & buffer second question
      (async () => {
        const q1 = await fetchQuestionData([], storedId);
        if (q1 === "GAMEOVER") {
          setGameOver(true);
          setInitialLoading(false);
          return;
        }
        if (q1) {
          setQuestion(q1);
          seenIdsRef.current = [q1.questionId];
          fillBufferQuestion([q1.questionId], storedId);
        }
        setInitialLoading(false);
      })();
    }
  }, [router, fillBufferQuestion]);

  // Start timer once question is loaded
  useEffect(() => {
    if (question && !isPlaying && timeLeft > 0 && !gameOver) {
      setIsPlaying(true);
      lastTickRef.current = Date.now();
    }
  }, [question, isPlaying, timeLeft, gameOver]);

  // Timer loop
  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        setTimeLeft((prev) => Math.max(0, prev - delta));
      }, 50);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isPlaying]);

  // End game on timer expiry
  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      setGameOver(true);
    }
  }, [timeLeft, gameOver]);

  // Record challenge result to SQLite DB when game ends
  useEffect(() => {
    if (gameOver && userId && userName) {
      fetch("/api/complete-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: userName,
          totalScore: score,
          totalCorrect: correctCount,
          totalAttempted: totalAttempted,
        }),
      }).catch((err) => console.error("Error posting to complete-challenge:", err));
    }
  }, [gameOver, userId, userName, score, correctCount, totalAttempted]);

  // Handle Option Click: Instant transition without showing correct answers during play
  const handleOptionClick = (option: string) => {
    if (!question || !userId || !isPlaying) return;

    const currentQ = question;

    // Asynchronously submit answer to API (non-blocking)
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        questionId: currentQ.questionId,
        selectedOption: option,
        timeRemainingMs: timeLeft,
      }),
    })
      .then((res) => res.json())
      .then((submitData) => {
        if (submitData) {
          const isCorrect = submitData.correct || false;
          const scoreAwarded = submitData.scoreAwarded || 0;
          if (isCorrect) {
            setScore((prev) => prev + scoreAwarded);
            setCorrectCount((prev) => prev + 1);
          }
          setAttemptHistory((prev) => [
            ...prev,
            {
              questionId: currentQ.questionId,
              imageUrl: currentQ.imageUrl,
              selectedOption: option,
              isCorrect,
              correctAnswer: submitData.correctAnswer || option,
            },
          ]);
        }
      })
      .catch((err) => console.error("Submit error", err));

    setTotalAttempted((prev) => prev + 1);

    // Instant zero-delay transition to next preloaded question
    if (nextQuestion) {
      setQuestion(nextQuestion);
      setNextQuestion(null);
      const updatedSeen = [...seenIdsRef.current, nextQuestion.questionId];
      seenIdsRef.current = updatedSeen;
      setQuestionCount((prev) => prev + 1);
      fillBufferQuestion(updatedSeen, userId);
    } else {
      (async () => {
        const newSeen = [...seenIdsRef.current, currentQ.questionId];
        const freshQ = await fetchQuestionData(newSeen, userId);
        if (freshQ === "GAMEOVER" || !freshQ) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIsPlaying(false);
          setGameOver(true);
        } else {
          setQuestion(freshQ);
          seenIdsRef.current = [...newSeen, freshQ.questionId];
          setQuestionCount((prev) => prev + 1);
          fillBufferQuestion(seenIdsRef.current, userId);
        }
      })();
    }
  };

  if (gameOver) {
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    return (
      <main className={styles.container} style={{ justifyContent: "center" }}>
        <div className={styles.resultCard}>
          <div className={styles.resultEmoji}>
            {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎯" : "⚡"}
          </div>
          <h1 className={styles.resultTitle}>Challenge Complete!</h1>
          <p className={styles.resultName}>{userName}</p>

          <div className={styles.resultStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{score}</span>
              <span className={styles.statLabel}>Points</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{correctCount}</span>
              <span className={styles.statLabel}>Correct</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalAttempted}</span>
              <span className={styles.statLabel}>Attempted</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{accuracy}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
          </div>

          {/* Individual Question Breakdown Section */}
          {attemptHistory.length > 0 && (
            <>
              <h3 className={styles.sectionHeading}>
                <span>📝</span> Individual Score & Answer Breakdown
              </h3>
              <div className={styles.breakdownContainer}>
                {attemptHistory.map((item, idx) => (
                  <div key={idx} className={styles.breakdownItem}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="Logo" className={styles.logoThumb} />
                    <div className={styles.breakdownDetails}>
                      <div className={styles.breakdownTitle}>
                        Logo #{idx + 1}: {item.correctAnswer || item.selectedOption}
                      </div>
                      <div className={styles.breakdownAnswer}>
                        Your Choice: {item.selectedOption}
                      </div>
                    </div>
                    <span className={item.isCorrect ? styles.badgeCorrect : styles.badgeIncorrect}>
                      {item.isCorrect ? "+10 pts" : "0 pts"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className={styles.resultActions}>
            <Link href="/" className="neon-button">
              🔄 Play Again
            </Link>
            <Link href="/leaderboard" className={styles.leaderboardBtn}>
              📊 View Overall Leaderboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (initialLoading && !question) {
    return (
      <main className={styles.container} style={{ justifyContent: "center" }}>
        <div className={styles.loadingText}>Initializing challenge...</div>
      </main>
    );
  }

  const timerPercentage = Math.max(0, (timeLeft / GAME_TIME_MS) * 100);
  const isDanger = timerPercentage < 25;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.questionCount}>Logo {questionCount}</div>
        <div className={styles.score} style={{ opacity: 0.7 }}>Mode: Blitz</div>
      </div>

      <div className={`${styles.timerBadge} ${isDanger ? styles.timerDanger : ""}`}>
        {formattedTime}
      </div>

      <div className={styles.logoContainer}>
        {question?.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={question.imageUrl}
            alt="Logo to guess"
            className={styles.logoImage}
            draggable={false}
          />
        )}
      </div>

      <div className={styles.optionsGrid}>
        {question?.options.map((opt: string) => {
          return (
            <button
              key={opt}
              className={styles.optionCard}
              onClick={() => handleOptionClick(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </main>
  );
}


