"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./leaderboard.module.css";

interface ScoreEntry {
  id?: string;
  name: string;
  score: number;
  rank?: number;
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function Leaderboard() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [userSpecific, setUserSpecific] = useState<ScoreEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLeaderboard = async () => {
    try {
      const storedId = localStorage.getItem("logo_guesser_user_id") || "";
      const res = await fetch(`/api/leaderboard?t=${Date.now()}${storedId ? `&userId=${storedId}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setScores(data.leaderboard);
        if (data.userSpecific) setUserSpecific(data.userSpecific);
      }
    } catch (err) {
      console.error("Leaderboard fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredScores = useMemo(() => {
    if (!searchQuery.trim()) return scores;
    return scores.filter((entry) =>
      entry.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [scores, searchQuery]);

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Global Leaderboard</h1>
      <p className={styles.subtitle}>Check where each person stands in the competition</p>

      {/* User Specific Position Banner */}
      {userSpecific && (
        <div className={styles.userPosBanner}>
          <div>
            <div className={styles.userPosTitle}>Your Current Standing</div>
            <div className={styles.userPosValue}>
              {userSpecific.name} — Position: {userSpecific.rank ? getOrdinalSuffix(userSpecific.rank) : "Unranked"}
            </div>
          </div>
          <div className={styles.userPosScore}>{userSpecific.score} pts</div>
        </div>
      )}

      {/* Search Input */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="🔍 Search participant by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading && scores.length === 0 ? (
        <div style={{ color: "var(--primary)", marginTop: "2rem", fontWeight: "600" }}>
          Aggregating live standings...
        </div>
      ) : (
        <ul className={styles.list}>
          {filteredScores.map((entry, idx) => {
            const actualRank = scores.findIndex((s) => s.id === entry.id) + 1 || idx + 1;
            let rankClass = "";
            let medalEmoji = "";

            if (actualRank === 1) {
              rankClass = styles.rank1;
              medalEmoji = "🥇";
            } else if (actualRank === 2) {
              rankClass = styles.rank2;
              medalEmoji = "🥈";
            } else if (actualRank === 3) {
              rankClass = styles.rank3;
              medalEmoji = "🥉";
            }

            const isMe = userSpecific?.id && entry.id === userSpecific?.id;
            const rowClass = isMe
              ? `${styles.row} ${rankClass} ${styles.currentUserRow}`.trim()
              : `${styles.row} ${rankClass}`.trim();

            return (
              <li key={entry.id || idx} className={rowClass}>
                <div className={styles.rankText}>
                  {medalEmoji ? <span className={styles.podiumBadge}>{medalEmoji}</span> : `#${actualRank}`}
                </div>
                <div className={styles.nameText}>
                  {entry.name} {isMe && <span style={{ fontSize: "0.8rem", color: "var(--primary)" }}>(You)</span>}
                </div>
                <div className={styles.scoreText}>{entry.score} pts</div>
              </li>
            );
          })}
        </ul>
      )}

      {userSpecific && userSpecific.rank && userSpecific.rank > 50 && !searchQuery && (
        <div style={{ width: "100%", marginTop: "2rem" }}>
          <p style={{ color: "#a1a1aa", textAlign: "center", marginBottom: "0.5rem" }}>Your Position</p>
          <div className={`${styles.row} ${styles.currentUserRow}`}>
            <div className={styles.rankText}>#{userSpecific.rank}</div>
            <div className={styles.nameText}>
              {userSpecific.name} <span style={{ fontSize: "0.8rem", color: "var(--primary)" }}>(You)</span>
            </div>
            <div className={styles.scoreText}>{userSpecific.score} pts</div>
          </div>
        </div>
      )}

      {filteredScores.length === 0 && !loading && (
        <p style={{ color: "#a1a1aa", marginTop: "2rem" }}>
          {searchQuery ? `No participants found matching "${searchQuery}".` : "No scores recorded yet."}
        </p>
      )}

      <div className={styles.navRow}>
        <Link href="/" className="neon-button">
          🎮 Play Challenge
        </Link>
      </div>
    </main>
  );
}

