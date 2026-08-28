# Production Cloud Storage & Vercel Deployment Guide

This document contains step-by-step instructions for deploying CAD Point CRM to **Vercel** with a **GoDaddy custom domain**, **Hosted PostgreSQL**, and **Supabase Cloud Storage**.

---

## 1. Cloud Storage Setup (Supabase Storage / S3)

1. Sign up / Log in to [Supabase](https://supabase.com/).
2. Create a new project (e.g. `cadpoint-crm-production`).
3. Go to **Storage** in the Supabase Dashboard and click **Create Bucket**:
   - **Bucket Name**: `cadpoint-crm-production`
   - **Public Bucket**: Toggle `ON` (or keep `OFF` for signed URLs).
4. Go to **Project Settings ➔ API**:
   - Copy your **Project URL** (`SUPABASE_URL`).
   - Copy your **service_role secret key** (`SUPABASE_SERVICE_ROLE_KEY`).

---

## 2. Production Database Setup (Neon / Supabase PostgreSQL)

1. In Supabase (or [Neon](https://neon.tech/)), go to **Project Settings ➔ Database**.
2. Copy your Connection String (`DATABASE_URL`).
3. Ensure the database string includes `?sslmode=require`.

---

## 3. Vercel Project Deployment Steps

1. Log in to [Vercel](https://vercel.com/) and click **Add New ➔ Project**.
2. Import your GitHub repository: `https://github.com/Sampathjai/CAD-POINT.git`.
3. In **Environment Variables**, add:

| Environment Variable Name | Recommended Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://user:password@db.region.supabase.co:5432/postgres?sslmode=require` |
| `DIRECT_DATABASE_URL` | `postgresql://user:password@db.region.supabase.co:5432/postgres?sslmode=require` |
| `JWT_SECRET` | `a-long-random-secure-secret-key-at-least-32-chars` |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-supabase-service-role-secret-key` |
| `SUPABASE_STORAGE_BUCKET` | `cadpoint-crm-production` |
| `CLIENT_URL` | `https://yourdomain.com,https://your-project.vercel.app` |

4. Click **Deploy**. Vercel will automatically build the React frontend (`client`) and API (`api/index.js`).

---

## 4. GoDaddy Custom Domain Setup

1. In Vercel, go to **Project Settings ➔ Domains** and enter your custom domain (e.g. `crm.yourdomain.com` or `yourdomain.com`).
2. Log in to your [GoDaddy Domain Portfolio](https://dcc.godaddy.com/):
   - Click **DNS Management** for your domain.
3. Add the following DNS Records:

| Type | Name / Host | Value / Target | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `crm` (or `www`) | `cname.vercel-dns.com` | 1 Hour |
| **A** | `@` (Root domain) | `76.76.21.21` | 1 Hour |

4. Vercel will automatically issue a free SSL/TLS certificate within 2–5 minutes.

---

## 5. Security & Isolation Guarantee

- 🔒 **Zero Local Filesystem Access**: In `production`, local OS disk scanning (`/Users/...`, `/Volumes/...`, `localhost`, `C:\`, `D:\`) is 100% disabled.
- 🛡️ **Multi-Tenant Storage**: All client files and documents are stored under isolated object keys:
  `organizations/{organizationId}/{category}/{timestamp}_{filename}`
- 🔑 **Serverless & Edge Compatible**: All storage calls happen server-side using secure API secrets without exposing private keys to the client browser.
