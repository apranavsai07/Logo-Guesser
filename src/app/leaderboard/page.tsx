"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./leaderboard.module.css";

interface ScoreEntry {
  id?: string;
  name: string;
  collegeId?: string;
  score: number;
  rank?: number;
}

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [userSpecific, setUserSpecific] = useState<ScoreEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const storedId = localStorage.getItem("logo_guesser_user_id") || "";
      // Prevent aggressive caching during dev
      const res = await fetch(`/api/leaderboard?t=${Date.now()}${storedId ? `&userId=${storedId}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setScores(data.leaderboard);
        if (data.userSpecific) setUserSpecific(data.userSpecific);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    // Refresh the leaderboard from Redis every 3 seconds for the live fest experience!
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Leaderboard</h1>
      <p className={styles.subtitle}>Top 50 Developers</p>

      {loading && scores.length === 0 ? (
        <div style={{ color: "var(--primary)", marginTop: "2rem", fontWeight: "600" }}>
          Aggregating Scores...
        </div>
      ) : (
        <ul className={styles.list}>
          {scores.map((entry, idx) => {
            let rankClass = "";
            if (idx === 0) rankClass = styles.rank1;
            else if (idx === 1) rankClass = styles.rank2;
            else if (idx === 2) rankClass = styles.rank3;

            const isMe = userSpecific?.id && entry.id === userSpecific?.id;
            const rowClass = isMe ? `${styles.row} ${rankClass} ${styles.currentUserRow}`.trim() : `${styles.row} ${rankClass}`.trim();

            return (
              <li key={idx} className={rowClass}>
                <div className={styles.rankText}>#{idx + 1}</div>
                <div className={styles.nameText}>
                  {entry.name}
                  {entry.collegeId && <span className={styles.rollNumber}>{entry.collegeId}</span>}
                </div>
                <div className={styles.scoreText}>{entry.score}</div>
              </li>
            );
          })}
        </ul>
      )}

      {userSpecific && userSpecific.rank && userSpecific.rank > 50 && (
        <div style={{ width: '100%', marginTop: '2rem' }}>
          <p style={{ color: '#a1a1aa', textAlign: 'center', marginBottom: '0.5rem' }}>Your Rank</p>
          <div className={`${styles.row} ${styles.currentUserRow}`}>
            <div className={styles.rankText}>#{userSpecific.rank}</div>
            <div className={styles.nameText}>
              {userSpecific.name}
              {userSpecific.collegeId && <span className={styles.rollNumber}>{userSpecific.collegeId}</span>}
            </div>
            <div className={styles.scoreText}>{userSpecific.score}</div>
          </div>
        </div>
      )}

      {scores.length === 0 && !loading && (
        <p style={{ color: "#a1a1aa", marginTop: "2rem" }}>No scores yet. Be the first!</p>
      )}

      <div className={styles.playAgainBtn}>
        <Link href="/" className="neon-button">
          Play Again
        </Link>
      </div>
    </main>
  );
}
