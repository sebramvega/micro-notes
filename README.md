# Micro Notes 📝

<p align="center"> <a href="https://github.com/sebramvega/micro-notes/actions/workflows/ci.yml"> <img src="https://github.com/sebramvega/micro-notes/actions/workflows/ci.yml/badge.svg" alt="CI"> </a> <img src="https://img.shields.io/badge/python-3.12%2B-blue" /> <img src="https://img.shields.io/badge/flask-3.x-green" /> <img src="https://img.shields.io/badge/react-18.x-61DAFB" /> <img src="https://img.shields.io/badge/docker-ready-2496ED" /> </p>

A microservices-based notes app with authentication.
Built with Flask (users + notes services), React (frontend), and Docker.
Tested with Pytest (backend) + Vitest/RTL (frontend) and wired into GitHub Actions CI.

---

## 🚀 Features

- User accounts with signup/login (JWT authentication).
- Notes CRUD (create, update, list, delete notes)
- React frontend with login form + notes interface.
- Full-stack Dockerized setup via `docker-compose`.
- Automated testing: Pytest for services, Vitest + React Testing Library for UI.
- Continuous Integration with GitHub Actions (matrix for backend/frontend).

---

## 📂 Project Structure

```
micro-notes/
├── services/
│   ├── users/       # Flask service: signup, login, JWT
│   └── notes/       # Flask service: CRUD notes
├── frontend/        # React app (Vite, JSX, styles)
├── docker-compose.yml
└── .github/workflows/ci.yml   # CI pipeline (pytest + vitest)
```

---

## ▶️ Run with Docker

```bash
# from repo root
docker compose up --build
```

- Users API → http://localhost:8001
- Notes API → http://localhost:8002
- Frontend → http://localhost:5173

---

## ⚡️ Getting Started (Dev)

### 1. Clone & setup
```bash
git clone https://github.com/sebramvega/micro-notes.git
cd micro-notes
```

### 2. Backend (Flask services)
```bash
cd services/users
pip install -r requirements.txt

cd ../notes
pip install -r requirements.txt
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev   # starts Vite dev server on :5173
```

---

## 🧪 Running Tests

### Backend
```bash
# run both services’ tests
docker compose run --rm users pytest -q
docker compose run --rm notes pytest -q
```

### Frontend
```bash
cd frontend
npm test -- --run
```
CI runs all of these automatically on push/PR.

---

## 🛠️ Tech Highlights

- Backend: Python 3.12, Flask, SQLAlchemy, JWT, Pytest
- Frontend: React 18, Vite, Vitest, React Testing Library
- DevOps: Docker Compose, GitHub Actions CI

---

## 📜 License

MIT License © 2025 [sebramvega]