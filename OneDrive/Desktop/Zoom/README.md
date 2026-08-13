# ZoomSpace — Full-Stack Video Conferencing Clone

A Zoom-inspired video conferencing application built with **Next.js**, **FastAPI**, **SQLite**, and **native WebRTC**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Vanilla CSS |
| Backend | FastAPI (Python 3.11), SQLAlchemy 2.0 |
| Database | SQLite (persistent disk on Render) |
| Real-time | Native WebRTC (P2P) + FastAPI WebSocket (signaling) |
| Deployment | Render.com (both services) |

---

## Features

- ✅ Instant meeting creation
- ✅ Scheduled meetings
- ✅ Join by Meeting ID or invite link
- ✅ WebRTC peer-to-peer audio/video
- ✅ Screen sharing
- ✅ Host controls (remove participant, mute all)
- ✅ Participant sidebar
- ✅ Zoom-inspired Carbon dark mode UI
- ✅ Responsive layout (desktop / tablet / mobile)

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # configure environment variables
npm run dev
```

Open: http://localhost:3000

---

## Deployment on Render

### One-Click Blueprint Deployment

1. Push this repo to GitHub (already done ✅)
2. Go to [render.com](https://render.com) and sign in
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repo (`SUSOVHAN100/Zoom`)
5. Render reads `render.yaml` and creates **both services automatically**
6. After both services deploy, set the `FRONTEND_URL` env var on the **backend service** to the URL of your deployed frontend (e.g. `https://zoomspace-frontend.onrender.com`)

### Manual Service Setup (Alternative)

#### Backend Service
| Setting | Value |
|---|---|
| **Type** | Web Service |
| **Runtime** | Python 3 |
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Disk** | Mount `/data`, 1 GB (for SQLite persistence) |
| **Env: DATABASE_URL** | `sqlite:////data/zoom_clone.db` |
| **Env: FRONTEND_URL** | `https://<your-frontend>.onrender.com` |

#### Frontend Service
| Setting | Value |
|---|---|
| **Type** | Web Service |
| **Runtime** | Node |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Env: NEXT_PUBLIC_API_URL** | `https://<your-backend>.onrender.com/api` |
| **Env: NEXT_PUBLIC_WS_URL** | `wss://<your-backend>.onrender.com` |

---

## Project Structure

```
Zoom/
├── render.yaml              # Render deployment blueprint
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + CORS
│   │   ├── database/        # SQLAlchemy setup
│   │   ├── models/          # Meeting, Participant, User, MeetingLink
│   │   ├── routers/         # REST API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── websocket/       # WebSocket signaling layer
│   ├── requirements.txt
│   └── test_suite.py        # 15 backend tests
└── frontend/
    ├── src/
    │   ├── app/             # Next.js pages (App Router)
    │   ├── components/      # Reusable UI components
    │   ├── hooks/           # useWebRTC hook
    │   └── services/        # api.ts (REST client)
    └── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/meetings` | Create instant meeting |
| POST | `/api/meetings/schedule` | Schedule a meeting |
| POST | `/api/meetings/join` | Join by ID or invite token |
| GET | `/api/meetings/upcoming` | List upcoming meetings |
| GET | `/api/meetings/recent` | List recent meetings |
| GET | `/api/meetings/{id}` | Get meeting details |
| GET | `/api/meetings/{id}/participants` | List active participants |
| DELETE | `/api/participants/{id}` | Remove participant |
| WS | `/ws/{meeting_id}` | WebRTC signaling WebSocket |
