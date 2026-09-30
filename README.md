# MyTasks • Intelligent Task Schedule & History

An intuitive, human-designed task scheduling and productivity platform built on the **MERN** stack (MongoDB, Express, React, Node.js). 

Featuring real-time date & time scheduling, smart priority management, multi-dimensional filtering, an accomplishment history archive, and a frictionless guest-to-account workflow.

![MyTasks Interface](https://raw.githubusercontent.com/placeholder/mytasks-banner.png)

---

## ✨ Features

- **🎯 Frictionless Guest-to-User Flow**: Visitors can immediately access the dashboard, explore, and create a task. When clicking *"Add Task"*, a sleek modal prompts them to create an account or sign in—and automatically saves their pending task upon authentication.
- **✨ Elegant Task Creation**: Thoughtfully designed task creator with rich inputs, interactive segmented priority pills (Low, Medium, High), status toggles, and date & time scheduling.
- **📅 Intelligent Date & Time Scheduling**: Schedule exact due dates & times with 1-click presets (*Today 5 PM*, *Tomorrow 9 AM*, *Next Week*). Badges automatically calculate relative status (*Overdue*, *Due Today*, *Tomorrow*, *Upcoming*).
- **🔍 Multi-Dimensional Filtering & Sorting**:
  - Filter by **Priority** (*High*, *Medium*, *Low*)
  - Filter by **Date** (*Due Today*, *Due This Week*, *Upcoming*, *Overdue*, *No Date*)
  - Filter by **State** (*Pending*, *In Progress*)
  - Sort by **Due Date (Soonest)**, **Newest**, **Oldest**, or **Priority (Highest)**
  - Real-time keyword search across titles and notes.
- **⏳ Accomplishment History & Timeline**: Dedicated history archive with exact completion timestamps (*e.g. "Finished on Tuesday, Sep 29 at 3:45 PM"*), scheduled dates, and 1-click **Restore to Tasks** action.
- **👑 Root Administrator Control Center & RBAC**: Dedicated administrative dashboard with system-wide analytics, user directory management, role promotion (`user` ↔ `admin`), global task moderation, and media storage audit.
- **🔒 Zero-Dependency Cryptographic Security**: Built using Node.js native `crypto` module (`scrypt` password hashing + RFC 7519 HMAC-SHA256 JWT tokens). No fragile external auth dependencies.
- **🚀 Deploy-Ready**: Preconfigured for **Vercel** serverless and **GitHub** version control.

---

## 📁 Project Structure

```
mern-task-app/
├── api/
│   └── index.js              # Vercel serverless entry point
├── client/                   # React 19 + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/       # Navbar, TaskForm, TaskItem, TasksPage, HistoryPage, AuthModal
│   │   ├── services/         # API client with JWT handling and VITE_API_URL support
│   │   ├── utils/            # Date formatting and scheduling helpers
│   │   ├── App.jsx           # Master application coordinator
│   │   └── index.css         # Modern, human-crafted design system
│   ├── index.html            # Google Fonts & SEO metadata
│   ├── package.json
│   ├── vercel.json           # Client-side SPA routing rewrites
│   └── vite.config.js        # Local dev proxy to backend port 5000
├── server/                   # Express + MongoDB REST API
│   ├── src/
│   │   ├── config/           # MongoDB Mongoose connection
│   │   ├── controllers/      # Task and Auth controllers
│   │   ├── middleware/       # JWT protect middleware
│   │   ├── models/           # User and Task schemas
│   │   ├── routes/           # REST endpoints (/api/auth, /api/tasks)
│   │   └── utils/            # Native crypto JWT & scrypt password hasher
│   ├── .env                  # Environment variables
│   ├── package.json
│   └── server.js             # Express server setup (exported for Vercel & local)
├── .gitignore                # Complete root gitignore
├── vercel.json               # Root Vercel full-stack deployment configuration
└── README.md
```

---

## 🛠️ Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) installed locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cloud cluster.

### 1. Configure Server Environment
Inside `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskmanager_db
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-in-production
```
*(If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection URI).*

### 2. Start Backend Server
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

### 3. Start Frontend Client
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🐙 Deploying to GitHub

1. Initialize git in the root folder:
   ```bash
   git init
   ```
2. Stage and commit all files:
   ```bash
   git add .
   git commit -m "feat: complete MyTasks application with scheduling, history, and deployment configs"
   ```
3. Create a new repository on [GitHub](https://github.com/new) named `MyTasks`.
4. Link your remote repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/MyTasks.git
   git branch -M main
   git push -u origin main
   ```

---

## ▲ Deploying to Vercel

### Option A: Full Repository (Serverless API + Vite Frontend)

1. Sign in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
2. Select your `MyTasks` GitHub repository.
3. Vercel will automatically read [vercel.json](file:///c:/Users/HP/Desktop/termresocurces/web2/project/mern-task-app/vercel.json):
   - **Build Command**: `cd client && npm install && npm run build`
   - **Output Directory**: `client/dist`
4. Add **Environment Variables** in the Vercel project settings:
   - `MONGO_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.mongodb.net/mytasks?retryWrites=true&w=majority`)
   - `JWT_SECRET`: A long random secret string
   - `NODE_ENV`: `production`
5. Click **Deploy**.

---

### Option B: Separate Backend (e.g. Render / Railway) + Vercel Frontend

If you prefer keeping Express running as a dedicated Node service:
1. Deploy `server/` to [Render](https://render.com) or [Railway](https://railway.app):
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Add `MONGO_URI` and `JWT_SECRET`.
2. Deploy `client/` to [Vercel](https://vercel.com):
   - Root Directory: `client`
   - Framework Preset: `Vite`
   - Add Environment Variable:
     - `VITE_API_URL`: `https://your-backend-api.onrender.com`
3. Click **Deploy**.

---

## 📄 License
MIT License. Built with care for productivity and human-centered design.
