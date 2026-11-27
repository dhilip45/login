# Backend Service (`server/`)

Node.js + Express REST API backed by MySQL 8.0 (`mysql2`) and `bcrypt` password hashing.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Verifies the Express API process is running. |
| `GET` | `/api/db-health` | Runs `SELECT 1` against MySQL to confirm database connectivity. |
| `POST` | `/api/auth/register` | Validates `name`, `email`, and `password`, hashes the password with `bcrypt`, and inserts the user into `users`. |
| `POST` | `/api/auth/login` | Validates `email` and `password`, looks up the user in MySQL, and verifies the password via `bcrypt.compare`. |

## Environment Variables

- `PORT` — HTTP port (default `5000`)
- `DB_HOST` — MySQL host (set to `database` in Docker Compose)
- `DB_PORT` — MySQL port (default `3306`)
- `DB_USER` — MySQL username
- `DB_PASSWORD` — MySQL password
- `MYSQL_DATABASE` — Target database name (`login_db`)
