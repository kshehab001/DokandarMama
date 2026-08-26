# Firebase & Cloud Deployment Guide for Dokandar Mama

This guide provides instructions for deploying **Dokandar Mama** frontend on **Firebase Hosting** (100% Free on the Spark plan) and connecting it with a **free PostgreSQL Database** (via Neon, Supabase, or Render) and Backend API Server.

---

## 1. Architecture Overview

```
┌────────────────────────────────────────┐
│     Firebase Hosting (Free Spark Tier) │
│     Frontend Single-Page React App     │
│     (Fast Global CDN + Custom Domain)  │
└───────────────────┬────────────────────┘
                    │ HTTPS API Requests
                    ▼
┌────────────────────────────────────────┐
│   Backend API Server (Node / Express)  │
│   • Render Free Web Service            │
│   • Or Firebase Cloud Functions / Run  │
└───────────────────┬────────────────────┘
                    │ Drizzle ORM / SQL
                    ▼
┌────────────────────────────────────────┐
│   PostgreSQL Database (Free Tier)      │
│   • Neon Serverless Postgres (Free)    │
│   • Supabase Postgres (Free)           │
│   • Render Managed Postgres (Free)     │
└────────────────────────────────────────┘
```

---

## 2. Deploy Frontend to Firebase Hosting (Step-by-Step)

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase in Dokandar Mama Root
```bash
firebase init hosting
```
- **Select**: Use an existing project (or create a new Firebase project).
- **Public directory**: `artifacts/dokandar-mama/dist/public`
- **Configure as single-page app**: `Yes`
- **Set up automatic builds with GitHub**: Optional (Yes/No)

### Step 4: Build and Deploy
```bash
pnpm run build
firebase deploy --only hosting
```

Your app will be live at `https://<your-project-id>.web.app`!

---

## 3. Free Database Setup Options

Dokandar Mama uses **PostgreSQL with Drizzle ORM** for ACID transactions, cash box registers, multi-tenant RBAC, and sales ledger.

### Option A: Neon Serverless Postgres (Recommended - 100% Free)
1. Sign up at [neon.tech](https://neon.tech).
2. Create a database `dokandar_mama`.
3. Copy the connection string: `postgresql://user:password@ep-xyz.neon.tech/dokandar_mama?sslmode=require`.
4. Set `DATABASE_URL` in your environment.

### Option B: Supabase (Free Tier)
1. Sign up at [supabase.com](https://supabase.com).
2. Create a new project.
3. In Project Settings $\to$ Database $\to$ Connection string, copy the URI.

### Option C: Render Free Postgres
1. In your Render Dashboard, click **New $\to$ PostgreSQL**.
2. Select the **Free** instance type.
3. Copy the **Internal Database URL** or **External Database URL**.

---

## 4. Run Database Migrations
Once your `DATABASE_URL` is set:
```bash
pnpm --filter @workspace/db run push-force
```

---

## 5. Required Environment Variables

| Variable | Description | Where to Get |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Neon / Supabase / Render Postgres |
| `CLERK_SECRET_KEY` | Clerk Auth Backend Secret Key | [dashboard.clerk.com](https://dashboard.clerk.com) |
| `CLERK_PUBLISHABLE_KEY` | Clerk Auth Public Key | [dashboard.clerk.com](https://dashboard.clerk.com) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend Clerk Publishable Key | [dashboard.clerk.com](https://dashboard.clerk.com) |
| `VITE_GEMINI_API_KEY` | (Optional) Gemini AI Key for Chotu | [aistudio.google.com](https://aistudio.google.com) |
| `SERVE_STATIC_DIR` | `artifacts/dokandar-mama/dist/public` | Built-in if serving single service |
