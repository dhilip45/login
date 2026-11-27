# Frontend Service (`client/`)

React.js + Vite login UI served in production by Nginx (`nginx:alpine`).

## Key Files

- `src/components/LoginForm.jsx` — Responsive blue-and-white login (and account registration) form with show/hide password toggle, remember-me checkbox, loading state, and error/success alerts.
- `src/services/api.js` — Fetch client using relative `/api` paths (no hardcoded `localhost:5000`).
- `nginx.conf` — Serves `/usr/share/nginx/html` on port `80` and reverse-proxies `/api/` requests to `http://backend:5000`.
- `Dockerfile` — Multi-stage build (`node:lts-alpine` builder -> `nginx:alpine` runtime).
