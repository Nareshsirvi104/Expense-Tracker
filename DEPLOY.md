# 🚀 Deployment Guide — Rupee Ledger

Deploy the **backend to Render** (free) and the **frontend to Vercel** (free).  
Total time: ~10 minutes.

---

## Overview

```
GitHub repo
├── backend/   ──▶  Render  (Node.js web service)
└── frontend/  ──▶  Vercel  (React static site)
```

---

## Step 1 — Push to GitHub

```bash
# In the expense-tracker/ folder
git init
git add .
git commit -m "initial commit"

# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/rupee-ledger.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render

1. Go to **https://render.com** → Sign up / log in (free tier works).
2. Click **New → Web Service**.
3. Connect your GitHub repo.
4. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `rupee-ledger-api` (or anything you like) |
   | **Root Directory** | `backend` |
   | **Environment** | `Node` |
   | **Build Command** | *(leave blank — no build step needed)* |
   | **Start Command** | `node server.js` |
   | **Instance Type** | `Free` |

5. Click **Create Web Service**.
6. Wait ~2 minutes for the first deploy to finish.
7. Copy your live URL — it looks like:  
   `https://rupee-ledger-api.onrender.com`
8. **Test it:** open `https://rupee-ledger-api.onrender.com/health` in your browser — you should see `ok`.

> **Note on free tier sleep:** Render's free tier spins down after 15 minutes of inactivity.  
> The first request after sleep takes ~30 seconds. This is normal for the free plan.

---

## Step 3 — Deploy Frontend on Vercel

1. Go to **https://vercel.com** → Sign up / log in with GitHub.
2. Click **Add New → Project**.
3. Import your GitHub repo.
4. Configure the project:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `frontend` |
   | **Framework Preset** | `Create React App` |
   | **Build Command** | `npm run build` *(auto-detected)* |
   | **Output Directory** | `build` *(auto-detected)* |

5. **Add Environment Variable** (critical step):
   - Click **Environment Variables** before deploying
   - Name: `REACT_APP_API_URL`
   - Value: `https://rupee-ledger-api.onrender.com`  
     *(use your actual Render URL from Step 2)*
   - Leave scope as **Production, Preview, Development**

6. Click **Deploy**.
7. Wait ~1 minute.
8. Vercel gives you a URL like `https://rupee-ledger.vercel.app` — open it!

---

## Step 4 — Verify It Works

1. Open your Vercel URL in an **incognito window**.
2. Check the Dashboard loads with data.
3. Add a new expense → it should appear in the list.
4. Edit and delete an expense.
5. Try Export CSV.
6. Open the Budget page and update a budget.

If anything looks wrong, open DevTools → Network tab and check for failed requests.

---

## Troubleshooting

### "Failed to fetch" / Network errors
- Make sure `REACT_APP_API_URL` in Vercel matches your exact Render URL (no trailing slash).
- Go to Vercel → Project → Settings → Environment Variables and double-check.
- After changing env vars, redeploy: Vercel → Deployments → ⋯ → Redeploy.

### Render is slow on first load
- Normal on the free tier (cold start). Wait 30 seconds and refresh.
- The `/health` endpoint will respond once the service is warm.

### Data resets on Render redeploy
- Render's free tier uses an ephemeral filesystem — `data.json` is lost on each deploy/restart.
- This is expected for the free tier. For persistent storage, upgrade to a paid plan or swap in a free database like [Supabase](https://supabase.com) (Postgres) or [MongoDB Atlas](https://www.mongodb.com/atlas).

### CORS errors in the browser console
- The backend sends `Access-Control-Allow-Origin` matching the request's `Origin` header.
- If you see CORS errors, confirm your Render service restarted after the latest push.

---

## Updating the App

```bash
# Make changes locally, then:
git add .
git commit -m "your change"
git push
```
Both Render and Vercel auto-deploy on every push to `main`. ✅

---

## Local Development (unchanged)

```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm start
```

The `"proxy": "http://localhost:3001"` in `frontend/package.json` handles local API calls.
