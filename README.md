# 3-Tier Login Application — Docker Compose Practice

A complete 3-tier Login Application built for practicing **Docker**, **Dockerfiles**, **Docker Compose**, **container networking**, **persistent volumes**, **health checks**, and **service-to-service communication** in Killercoda or local Docker environments.

---

## 1. Project Architecture

```text
Browser (Host / Killercoda Port 3000)
   │
   ▼  HTTP :3000 -> :80
┌──────────────────────────────────────┐
│  frontend (Nginx + React Vite build) │
│  Serves static SPA from /            │
│  Proxies /api/* ─────────────────────┼──┐
└──────────────────────────────────────┘  │
                                          │ Docker DNS: http://backend:5000
┌──────────────────────────────────────┐  │
│  backend (Node.js + Express REST)    │◄─┘
│  GET  /api/health                    │
│  GET  /api/db-health                 │
│  POST /api/auth/register             │
│  POST /api/auth/login                │
└──────────────────┬───────────────────┘
                   │ Docker DNS: database:3306 (mysql2 pool)
                   ▼
┌──────────────────────────────────────┐
│  database (MySQL 8.0)                │
│  Database: login_db | Table: users   │
│  Volume: mysql_data:/var/lib/mysql   │
└──────────────────────────────────────┘
```

### Expected Request Flow

1. User opens the application in a browser on port `3000`.
2. Nginx serves the compiled React login page (`index.html` + static assets).
3. Submitting login or registration sends a `fetch` request to `/api/auth/login` or `/api/auth/register` on the same origin.
4. Nginx intercepts `/api/` and reverse-proxies the request over the Docker bridge network to `http://backend:5000`.
5. Express validates the payload, hashes/verifies passwords using `bcrypt`, and queries MySQL over `database:3306` using `mysql2`.
6. Express returns a JSON response through Nginx back to React, which renders a loading indicator followed by a success or error alert.

---

## 2. Folder Structure

```text
login-app/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   └── LoginForm.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   ├── README.md
│   └── server.js
├── database/
│   └── init.sql
├── .env.example
├── .gitignore
├── docker-compose.yaml
└── README.md
```

---

## 3. Technology Stack

- **Frontend:** React 19, Vite, HTML5, CSS3, JavaScript, Nginx (`nginx:alpine`)
- **Backend:** Node.js (LTS Alpine), Express.js, `mysql2`, `bcrypt`, `cors`, `dotenv`
- **Database:** MySQL 8.0 (`mysql:8.0`)
- **Containerization:** Docker multi-stage builds, Docker Compose v2

---

## 4. Dockerfile Explanations

### Frontend (`client/Dockerfile`)

Uses a **multi-stage build** to keep the runtime image small and free of Node build tools:
1. **Builder stage (`node:lts-alpine`):** Installs npm dependencies (`npm install`) and compiles the production Vite bundle (`npm run build`) into `/app/dist`.
2. **Runtime stage (`nginx:alpine`):** Removes Nginx's default site config, copies `client/nginx.conf` to `/etc/nginx/conf.d/default.conf`, copies `/app/dist` into `/usr/share/nginx/html`, exposes port `80`, and starts Nginx in the foreground (`nginx -g "daemon off;"`).

### Backend (`server/Dockerfile`)

1. Starts from `node:lts-alpine` and sets `WORKDIR /app`.
2. Temporarily installs `python3`, `make`, and `g++` so native `bcrypt` bindings build reliably on Alpine regardless of architecture, installs production dependencies (`npm install --omit=dev`), and removes the build toolchain.
3. Copies backend source files (`server.js`, `config/`, `controllers/`, `routes/`).
4. Exposes port `5000` and starts the API with `npm start`.

Both `client/.dockerignore` and `server/.dockerignore` exclude `node_modules`, `.env`, `.git`, and logs from the Docker build context.

---

## 5. Docker Compose Explanation

`docker-compose.yaml` defines three services:

| Service | Source / Image | Ports | Depends On | Restart Policy |
| --- | --- | --- | --- | --- |
| `frontend` | Build `./client` | `3000:80` | `backend` | `unless-stopped` |
| `backend` | Build `./server` | `5000:5000` | `database` (`service_healthy`) | `unless-stopped` |
| `database` | `mysql:8.0` | internal `3306` | — | `unless-stopped` |

All environment values are injected from `.env` (copied from `.env.example`), avoiding hardcoded secrets in Compose or source files.

---

## 6. Database Initialization

- `database/init.sql` creates the `login_db` database and the `users` table (`id`, `name`, `email`, `password`, `created_at`).
- Docker Compose bind-mounts `./database/init.sql` into `/docker-entrypoint-initdb.d/init.sql:ro`.
- The official `mysql:8.0` entrypoint automatically executes `.sql` scripts in `/docker-entrypoint-initdb.d/` **when the data volume is initialized for the first time**.

---

## 7. Container Networking & Service Communication

All three services attach to the Compose bridge network `app-network`. Docker's embedded DNS resolves each service name to its container IP:

- **How Frontend communicates with Backend:**
  - React (`client/src/services/api.js`) sends requests to relative `/api/...` paths (never `localhost:5000`), so it works cleanly from any browser host or Killercoda preview URL.
  - Nginx (`client/nginx.conf`) matches `location /api/` and runs `proxy_pass http://backend:5000;`, forwarding the request over `app-network` to the `backend` container.
- **How Backend communicates with MySQL:**
  - `server/config/db.js` connects to `DB_HOST` (`database`) on `DB_PORT` (`3306`) instead of `localhost`.

---

## 8. Persistent Volume

Docker Compose declares a named volume `mysql_data` mounted at `/var/lib/mysql` inside `database`. Stopping and removing containers with `docker compose down` preserves user records across container recreation. (Only `docker compose down -v` removes the volume.)

---

## 9. Health Checks

- **MySQL container health check:** `mysqladmin ping -h 127.0.0.1 -u root -p$$MYSQL_ROOT_PASSWORD || exit 1` runs every `10s` with a `30s` `start_period` and `5` retries.
- **Startup ordering:** `backend` uses `depends_on: database: condition: service_healthy`, preventing `ECONNREFUSED` crashes while MySQL initializes.
- **Application health endpoints:**
  - `GET /api/health` confirms the Express server is responsive.
  - `GET /api/db-health` runs `SELECT 1` via the `mysql2` connection pool and returns `200` when MySQL is reachable (`503` otherwise).

---

## 10. Quick Start & Killercoda Practice Guide

### Step 1: Configure environment variables

```bash
cp .env.example .env
# Edit .env and set a secure MYSQL_ROOT_PASSWORD and matching DB_PASSWORD
```

### Step 2: Build and start the stack

```bash
docker compose up -d --build
docker compose ps
```

Wait until `database` shows `(healthy)`.

### Step 3: Verify health endpoints

```bash
# Direct backend health checks
curl -i http://localhost:5000/api/health
curl -i http://localhost:5000/api/db-health

# Proxied through Nginx (frontend -> backend -> MySQL)
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/db-health
```

### Step 4: Test registration, login, and bcrypt hashing

```bash
# Register a user through the Nginx reverse proxy
curl -i -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Example","email":"alice@example.com","password":"Password123!"}'

# Verify valid login
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password123!"}'

# Verify invalid password is rejected (HTTP 401)
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"WrongPassword"}'
```

Inspect stored rows in MySQL to confirm passwords are bcrypt-hashed (starting with `$2b$`):

```bash
docker compose exec database sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT id, name, email, LEFT(password, 20) AS password_prefix, created_at FROM login_db.users;"'
```

### Step 5: Verify persistent volume across container recreation

```bash
docker compose down
docker compose up -d
# Re-test login; the user registered earlier must still succeed
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Password123!"}'
```
