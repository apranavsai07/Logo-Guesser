"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./play.module.css";

const MAX_QUESTIONS = 10;
const ROUND_TIME_MS = 10000;

export default function Play() {
  const router = useRouter();
  
  const [userId, setUserId] = useState<string | null>(null);
  
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [questionCount, setQuestionCount] = useState(1);
  const [score, setScore] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME_MS);
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
    if (question && !selectedOption) {
      startTimer();
    }
    return () => stopTimer();
  }, [question, selectedOption]);

  const fetchNextQuestion = async () => {
    setLoading(true);
    setSelectedOption(null);
    setCorrectAnswer(null);
    setTimeLeft(ROUND_TIME_MS);
    
    try {
      const res = await fetch("/api/question");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestion(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    stopTimer();
    lastTickRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - delta);
        if (next === 0) {
          stopTimer();
          handleTimeOut();
        }
        return next;
      });
    }, 50); // fast tick for smooth visual bar
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTimeOut = async () => {
    await submitAnswer("[TIMEOUT]", 0);
  };

  const handleOptionClick = async (option: string) => {
    if (selectedOption || !question || !userId) return; // Prevent double clicks
    stopTimer();
    await submitAnswer(option, timeLeft);
  };

  const submitAnswer = async (option: string, timeRemaining: number) => {
    setSelectedOption(option);
    
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          questionId: question.questionId,
          selectedOption: option,
          timeRemainingMs: timeRemaining,
        })
      });
      
      const data = await res.json();
      setCorrectAnswer(data.correctAnswer);
      
      if (data.correct) {
        setScore(prev => prev + data.scoreAwarded);
      }

      // Wait 1.5 seconds to show the CSS feedback, then proceed
      setTimeout(() => {
        if (questionCount >= MAX_QUESTIONS) {
          router.push("/leaderboard");
        } else {
          setQuestionCount(prev => prev + 1);
          fetchNextQuestion();
        }
      }, 1500);
      
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
  const timerPercentage = Math.max(0, (timeLeft / ROUND_TIME_MS) * 100);
  const isDanger = timerPercentage < 25;

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div className={styles.questionCount}>
          Logo {questionCount} <span style={{ opacity: 0.5 }}>/ {MAX_QUESTIONS}</span>
        </div>
        <div className={styles.score}>Score: {score}</div>
      </div>

      <div className={styles.timerBarContainer}>
        <div 
          className={`${styles.timerBar} ${isDanger ? styles.timerDanger : ""}`} 
          style={{ width: `${timerPercentage}%` }}
        />
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
