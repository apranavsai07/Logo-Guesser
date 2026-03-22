"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  // 0 = DevCatalyst logo + name
  // 1 = Catalyst Days fest name
  // 2 = Logo Guesser Form
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Cinematic Intro Timers: 3 seconds per screen
    if (step === 0) {
      const t = setTimeout(() => setStep(1), 3000);
      return () => clearTimeout(t);
    } else if (step === 1) {
      const t = setTimeout(() => setStep(2), 3000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, collegeId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      localStorage.setItem("logo_guesser_user_id", data.user.id);
      localStorage.setItem("logo_guesser_name", data.user.name);

      router.push("/play");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <main
        className={styles.introContainer}
        onClick={() => setStep(2)}
        style={{
          opacity: step === 0 ? 1 : 0,
          visibility: step === 0 ? 'visible' : 'hidden',
          position: 'absolute',
          inset: 0,
          transition: 'opacity 0.8s ease-in-out',
          zIndex: 50,
          backgroundColor: 'var(--background)'
        }}
      >
        <div className="global-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/devcatalyst-logo.jpeg"
            alt="DevCatalyst Logo"
            className={styles.introLogo}
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <h1 className={styles.devCatalystTitle}>DevCatalyst</h1>
          <p className={styles.introSubtitle}>Presents</p>
        </div>
      </main>

      <main
        className={styles.introContainer}
        onClick={() => setStep(2)}
        style={{
          opacity: step === 1 ? 1 : 0,
          visibility: step === 1 ? 'visible' : 'hidden',
          position: 'absolute',
          inset: 0,
          transition: 'opacity 0.8s ease-in-out',
          zIndex: 40,
          backgroundColor: 'var(--background)'
        }}
      >
        <div className="global-fade-in">
          <h1 className={styles.festTitle}>Catalyst Days</h1>
        </div>
      </main>

      <main
        className={styles.main}
        style={{
          opacity: step === 2 ? 1 : 0,
          visibility: step === 2 ? 'visible' : 'hidden',
          transition: 'opacity 1.5s ease-in-out',
        }}
      >
        <h1 className={styles.title}>Logo Guesser</h1>
        <p className={styles.subtitle}>Identify the world's top tech logos before time expires.</p>

        <form onSubmit={handleSubmit} className={`${styles.formContainer} glass-panel`}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name or Nickname</label>
            <input
              id="name"
              type="text"
              required
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="collegeId">College ID / Registration No.</label>
            <input
              id="collegeId"
              type="text"
              required
              placeholder="e.g. 21BCE102"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className="neon-button" disabled={loading} style={{ marginTop: "1rem" }}>
            {loading ? "Initializing..." : "START GAME"}
          </button>
        </form>
      </main>
    </>
  );
}
