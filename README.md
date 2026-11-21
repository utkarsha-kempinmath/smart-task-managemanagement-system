# SmartTask — Intelligent Academic Task & Schedule Planner (MERN Stack)

A complete MERN stack implementation of the **SmartTask System** designed according to the architectural UML diagrams (Use Case, Component / Composite Structure, Class Diagram, State Machine, and Layered Architecture).

---

## 🌟 Key Highlights & Design Philosophy

1. **Pure Algorithmic Smart Engine (Zero Artificial AI / LLM Wrappers)**:
   - **TaskAnalyzer Heuristic Engine**: Calculates dynamic **Smart Priority Scores (0 - 160)** based on deadline proximity, estimated effort, user priority, and overdue penalties. Automatically categorizes tasks into the **Eisenhower Matrix** quadrants (*Urgent & Important*, *Important / Strategic*, *Urgent / Low Effort*, *Backlog / Flexible*) with explainable recommendations.
   - **Smart Daily Time-Blocking Engine**: Automatically packs uncompleted deliverables into balanced focus blocks (e.g. 50-60 min) with cognitive reset breaks (10-15 min) between defined study windows (e.g., 9:00 AM - 6:00 PM), computing schedule feasibility (*Optimal*, *Heavy*, or *Overloaded*).
   - **Deep Work Focus Mode**: CADENCE Pomodoro / Deep Work timer with Web Audio acoustic chimes, task time logging (`actualTimeSpent`), notes, and celebration confetti.

2. **In-App Notification Center**:
   - Replaced external email with a live in-app notification center.
   - Unread badge counter in navbar, real-time toast alerts, notification drawer, automated deadline proximity warnings (<24h), and overdue notices.

3. **Minimal, Classy Aesthetic**:
   - **Zero dark blue or purple / cosmic AI neon gradients**.
   - Built with warm charcoal, slate, and stone tones (`#0f0f11`, `#18181b`, `#27272a`, `#f4f4f5`), subtle sage/emerald accents (`#059669`) and warm amber for alerts.
   - Elegant dark mode by default with an instant clean light mode toggle.

---

## 🔑 Demo Credentials

| Role | Email | Password | Details |
|---|---|---|---|
| **Student** | `student@smarttask.com` | `student123` | Pre-loaded with courses, sample tasks, focus sessions, and schedule |
| **System Admin** | `admin@smarttask.com` | `admin123` | Full access to Student Directory, Category Management & System Reports |

*(New student or admin accounts can also be created via the Register screen)*

---

## 🚀 Running the System

### 1. Backend Server
```bash
cd backend
npm install
node seed.js    # (Optional: resets and seeds sample data)
npm start       # Runs Express on http://localhost:5000
```

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev     # Runs Vite React client on http://localhost:5173
```
