"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./play.module.css";

const GAME_TIME_MS = 120000;

export default function Play() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [questionCount, setQuestionCount] = useState(1);
  const [score, setScore] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(GAME_TIME_MS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seenIds, setSeenIds] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    // Authenticate
    const storedId = localStorage.getItem("logo_guesser_user_id");
    if (!storedId) {
      router.push("/");
    } else {
      setUserId(storedId);
      fetchNextQuestion();
    }
  }, [router]);

  useEffect(() => {
    // Start global timer when first question loads
    if (question && !isPlaying && timeLeft > 0) {
       setIsPlaying(true);
       lastTickRef.current = Date.now();
    }
  }, [question, isPlaying, timeLeft]);

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
    if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPlaying(false);
      router.push("/leaderboard");
    }
  }, [timeLeft, router]);

  const fetchNextQuestion = async (newSeenId?: number) => {
    setLoading(true);
    setSelectedOption(null);
    setCorrectAnswer(null);
    
    let currentSeenIds = [...seenIds];
    if (newSeenId && !currentSeenIds.includes(newSeenId)) {
      currentSeenIds.push(newSeenId);
      setSeenIds(currentSeenIds);
    }
    
    try {
      const res = await fetch("/api/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          excludeIds: currentSeenIds,
          userId: userId || localStorage.getItem("logo_guesser_user_id") 
        })
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.gameOver) {
        router.push("/leaderboard");
      } else {
        setQuestion(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    if (selectedOption || !question || !userId || !isPlaying) return; // Prevent double clicks
    await submitAnswer(option);
  };

  const submitAnswer = async (option: string) => {
    // Capture the current question since the state will be cleared immediately
    const currentQuestionId = question.questionId;
    
    // Instantly advance to the next question to save time
    setQuestionCount(prev => prev + 1);
    fetchNextQuestion(currentQuestionId);
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          questionId: currentQuestionId,
          selectedOption: option,
          timeRemainingMs: 0,
        })
      });
      
      const data = await res.json();
      
      if (data.correct) {
        setScore(prev => prev + data.scoreAwarded);
      }
      
    } catch (err) {
      console.error("Submit error", err);
    }
  };

  if (loading && !question) {
    return (
      <main className={styles.container} style={{ justifyContent: "center" }}>
        <div className={styles.loadingText}>Loading next logo...</div>
      </main>
    );
  }

  // Calculate timer bar width percentage
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
          
          let stateClass = "";
          if (selectedOption && correctAnswer) {
            if (opt === correctAnswer) {
              stateClass = styles.correct;
            } else if (opt === selectedOption && opt !== correctAnswer) {
              stateClass = styles.incorrect;
            }
          } else if (selectedOption === opt && !correctAnswer) {
            // Selected but waiting for API response to validate
            stateClass = "";
          }

          return (
            <button
              key={opt}
              className={`${styles.optionCard} ${stateClass}`}
              onClick={() => handleOptionClick(opt)}
              disabled={!!selectedOption}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </main>
  );
}
