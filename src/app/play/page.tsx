"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./play.module.css";

const GAME_TIME_MS = 60000;

export default function Play() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  
  const [question, setQuestion] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [questionCount, setQuestionCount] = useState(1);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(GAME_TIME_MS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);
  const seenIdsRef = useRef<number[]>([]);

  useEffect(() => {
    const storedId = localStorage.getItem("logo_guesser_user_id");
    const storedName = localStorage.getItem("logo_guesser_name") || "";
    if (!storedId) {
      router.push("/");
    } else {
      setUserId(storedId);
      setUserName(storedName);
      fetchNextQuestion([], storedId);
    }
  }, [router]);

  useEffect(() => {
    if (question && !isPlaying && timeLeft > 0 && !gameOver) {
       setIsPlaying(true);
       lastTickRef.current = Date.now();
    }
  }, [question, isPlaying, timeLeft, gameOver]);

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

  useEffect(() => {
    if (timeLeft === 0 && !gameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      setGameOver(true);
    }
  }, [timeLeft, gameOver]);

  const fetchNextQuestion = async (currentSeenIds: number[], uid?: string) => {
    setTransitioning(true);
    
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          excludeIds: currentSeenIds,
          userId: uid || userId
        })
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.gameOver) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
        setGameOver(true);
      } else {
        setQuestion(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInitialLoading(false);
      setTransitioning(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    if (selectedOption || !question || !userId || !isPlaying) return;
    
    setSelectedOption(option);
    const currentQuestionId = question.questionId;
    const newSeenIds = [...seenIdsRef.current, currentQuestionId];
    seenIdsRef.current = newSeenIds;
    setSeenIds(newSeenIds);
    setQuestionCount(prev => prev + 1);
    setTotalAttempted(prev => prev + 1);
    
    const submitPromise = fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        questionId: currentQuestionId,
        selectedOption: option,
        timeRemainingMs: 0,
      })
    }).then(res => res.json()).catch(err => {
      console.error("Submit error", err);
      return null;
    });
    
    const questionPromise = fetch("/api/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        excludeIds: newSeenIds,
        userId
      })
    }).then(res => res.json()).catch(err => {
      console.error("Fetch error", err);
      return null;
    });
    
    setTransitioning(true);
    setSelectedOption(null);
    
    const [submitData, questionData] = await Promise.all([submitPromise, questionPromise]);
    
    if (submitData && submitData.correct) {
      setScore(prev => prev + submitData.scoreAwarded);
      setCorrectCount(prev => prev + 1);
    }
    
    if (questionData) {
      if (questionData.gameOver) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
        setGameOver(true);
      } else {
        setQuestion(questionData);
      }
    }
    
    setTransitioning(false);
  };

  if (gameOver) {
    return (
      <main className={styles.container} style={{ justifyContent: "center" }}>
        <div className={styles.resultCard}>
          <div className={styles.resultEmoji}>🎮</div>
          <h1 className={styles.resultTitle}>Time&apos;s Up!</h1>
          <p className={styles.resultName}>{userName}</p>
          
          <div className={styles.resultStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{score}</span>
              <span className={styles.statLabel}>Score</span>
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
          </div>

          <p className={styles.resultAccuracy}>
            Accuracy: {totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0}%
          </p>
          
          <div className={styles.resultActions}>
            <Link href="/" className="neon-button">Play Again</Link>
          </div>
        </div>
      </main>
    );
  }

  if (initialLoading && !question) {
    return (
      <main className={styles.container} style={{ justifyContent: "center" }}>
        <div className={styles.loadingText}>Loading next logo...</div>
      </main>
    );
  }

  const timerPercentage = Math.max(0, (timeLeft / GAME_TIME_MS) * 100);
  const isDanger = timerPercentage < 25;
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.questionCount}>
          Logo {questionCount}
        </div>
        <div className={styles.score}>Score: {score}</div>
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
              className={`${styles.optionCard}`}
              onClick={() => handleOptionClick(opt)}
              disabled={transitioning}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </main>
  );
}
