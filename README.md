# 🚀 Logo Guesser (Catalyst Days)

A high-performance, real-time logo guessing game built for bursty college fest traffic. Participants identify tech logos under a 10-second timer to climb a live global leaderboard.

## 🏗️ Architecture Note (For Developers)

This project uses **Next.js 14+ (App Router)**. Unlike traditional apps separated into distinct `/frontend` and `/backend` folders, Next.js is a **Fullstack React Framework**. 

Both the frontend views and the backend API routes live inside the unified `src/app/` folder. This is the modern standard! It allows Vercel to automatically split our API backend into serverless edge functions while serving the frontend flawlessly from the same repository.

### Folder Structure
*   `src/app/api/`: **[BACKEND]** Serverless API endpoints for registering users, validating answers, and fetching the Redis leaderboard.
*   `src/app/`: **[FRONTEND]** The Landing Page (`page.tsx`) and CSS.
*   `src/app/play/`: **[FRONTEND]** The main quiz game loop.
*   `src/app/leaderboard/`: **[FRONTEND]** Real-time scoreboard view.
*   `src/utils/`: **[BACKEND]** Database client initializers (Supabase & Upstash Redis).
*   `scripts/`: Database setup scripts for seeding logos.
*   `public/`: Static global assets (like `devcatalyst-logo.jpeg`).

## 🛠️ Tech Stack
*   **Framework:** Next.js (TypeScript)
*   **Styling:** Vanilla CSS Modules with a premium Glassmorphism Dark Theme.
*   **Database (Storage):** Supabase (PostgreSQL)
*   **Cache & Leaderboard:** Upstash (Serverless Redis) for ultra-fast `O(log(N))` ZSET ranking updates.

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a file named `.env.local` directly in the root folder (same level as this README). Ask the repository owner for the keys or refer to `.env.local.example`.
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-secret-key"
UPSTASH_REDIS_REST_URL="https://your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### 3. Setup the Database
1. Go to your Supabase project's SQL Editor.
2. Copy all the code from `supabase_schema.sql` and run it to create your tables.
3. Seed the logos database by running our script locally:
```bash
node --env-file=.env.local scripts/seed_logos.js
```

### 4. Run the Dev Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to start playing!

---

## 🚀 Deployment to Vercel

1. **Commit your code and push it to a new GitHub repository.**
2. Go to [Vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. **CRITICAL:** Before clicking deploy, open the **"Environment Variables"** dropdown and paste in the 4 keys from your `.env.local` file.
5. Click **Deploy**! Vercel handles all the routing and serverless function packaging automatically.
