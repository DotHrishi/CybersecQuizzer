# 🛡️ CyberShield Daily Quiz Web Application

A full-stack, production-ready **Cybersecurity Daily Quiz Web Application** built with **Next.js (App Router)**, **TypeScript**, **Prisma ORM**, **SQLite**, **Tailwind CSS**, and **Framer Motion / Canvas-Confetti**.

---

## 🌟 Key Features

1. **Passwordless Nickname Identity**:
   - Zero login friction (no password, email, or OTP).
   - Clear modal guidance instructing users to maintain the same nickname for leaderboard consistency.
   - Auto-persists nickname in browser `localStorage`.

2. **Strict Time Window & Weekend Blackout**:
   - Available **Monday through Friday** between **11:00 AM and 9:00 PM** local time.
   - Displays clear status screens outside window (Before 11 AM, After 9 PM, Weekends).
   - Leaderboards and Personal Reports remain accessible 24/7.

3. **Single Attempt Daily Limit**:
   - Enforces 1 quiz attempt per user per day.
   - Checked via `localStorage`, browser cookies, and database level `(userName, quizDate)` constraints.

4. **Verbatim Question Selection**:
   - Serves exactly **1 active question** randomly per attempt using verbatim raw SQL:
     ```sql
     SELECT * FROM questions WHERE active=1 ORDER BY RANDOM() LIMIT 1;
     ```

5. **Speed Bonus Scoring Matrix**:
   - Base Score: Correct = `1 pt`, Wrong = `0 pts`.
   - Speed Bonus based on response time:
     - `< 5s`: `+10 bonus`
     - `5–10s`: `+8 bonus`
     - `10–20s`: `+6 bonus`
     - `20–30s`: `+4 bonus`
     - `30–60s`: `+2 bonus`
     - `> 60s`: `+1 bonus`

6. **Privacy-Preserving Database Storage**:
   - Records **ONLY**: `userName`, `quizDate`, `isCorrect`, `score`, `bonusPoints`, `totalPoints`, `responseTimeMs`, `createdAt`.
   - **Zero connection** to question ID or selected option to maintain question privacy.

7. **Celebration Reactions**:
   - **Correct Answer**: Confetti cannon burst (`canvas-confetti`), floating gold trophy, sparkles, and speed bonus breakdown.
   - **Incorrect Answer**: Subtle sad card displaying *"Better luck next time."* without revealing the correct answer.

8. **Aggregated Leaderboards**:
   - **Daily**, **Weekly**, and **Monthly** leaderboards.
   - Shows Rank, User Name, Attempts, Correct Answers, Total Points, Average Response Time, and Last Attempt date.

9. **24/7 Personal Performance Report**:
   - Lifetime statistics: Total Attempts, Accuracy %, Average Response Time, Best Rank, and complete Attempt Timeline.

10. **Question Bank Admin Panel (`/admin`)**:
    - Password-protected access via `ADMIN_PASSWORD`.
    - Full CRUD management (Add, Edit, Delete, Enable/Disable).
    - Bulk **JSON Import** & **JSON Export**.
    - Optional Leaderboard Reset capability.
    - System metrics overview.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Styling**: Tailwind CSS (Dark Mode & Cyberpunk Glow Aesthetics)
- **Icons**: Lucide React
- **Validation**: Zod (Form validation everywhere)
- **Toast Notifications**: React Hot Toast (Rate limit & error toasts)
- **Effects**: Canvas Confetti & Framer Motion

---

## 📁 Project Folder Structure

```
quiz app/
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── README.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx               (Home / Live Quiz Page)
    │   ├── leaderboard/
    │   │   └── page.tsx           (Leaderboard Page)
    │   ├── report/
    │   │   └── page.tsx           (User Performance Report)
    │   ├── admin/
    │   │   └── page.tsx           (Admin Dashboard)
    │   └── api/
    │       ├── user/session/route.ts
    │       ├── quiz/question/route.ts
    │       ├── quiz/submit/route.ts
    │       ├── leaderboard/route.ts
    │       ├── report/route.ts
    │       └── admin/
    │           ├── questions/route.ts
    │           ├── stats/route.ts
    │           └── reset/route.ts
    ├── components/
    │   ├── Navbar.tsx
    │   ├── NameEntryModal.tsx
    │   ├── TimingGuardCard.tsx
    │   ├── QuizCard.tsx
    │   ├── ResultCelebration.tsx
    │   ├── LeaderboardTable.tsx
    │   ├── UserReportView.tsx
    │   └── AdminDashboard.tsx
    ├── lib/
    │   ├── db.ts                  (Prisma Client singleton)
    │   ├── quizGuard.ts           (Time & Weekend restriction logic)
    │   ├── scoring.ts             (Speed bonus calculator)
    │   ├── rateLimit.ts           (API Rate Limiter with Toasts)
    │   └── validation.ts          (Zod validation schemas)
    └── types/
        └── quiz.ts
```

---

## 🚀 Quick Start & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Push Database Schema (SQLite)
```bash
npx prisma db push
```

### 3. Seed Question Bank
```bash
npm run db:seed
```

### 4. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables (`.env`)

| Variable Name | Description | Default Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLite database connection string | `"file:./dev.db"` |
| `ADMIN_PASSWORD` | Administrative password for `/admin` access | `"cyberadmin123"` |
| `SESSION_SECRET` | Secret key for quiz session tokens | `"super_secret_cybersecurity_quiz_token_key_2026"` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `"http://localhost:3000"` |

---

## ☁️ Deployment Instructions for Vercel

1. **Database Setup for Vercel (LibSQL / Turso)**:
   Because Vercel serverless functions run on ephemeral containers, standard file writes to `dev.db` reset on container recycling. For production persistence on Vercel, use **Turso** (LibSQL SQLite over HTTP):
   ```bash
   turso db create cybersecurity-quiz
   turso db show cybersecurity-quiz --url
   turso db tokens create cybersecurity-quiz
   ```

2. **Configure Vercel Environment Variables**:
   In your Vercel Dashboard project settings, add:
   - `DATABASE_URL`: `libsql://cybersecurity-quiz-[username].turso.io`
   - `ADMIN_PASSWORD`: Your custom production admin password.
   - `SESSION_SECRET`: Random 32-character string.

3. **Deploy with Vercel CLI or GitHub**:
   ```bash
   npx vercel --prod
   ```
