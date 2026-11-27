import LoginForm from './components/LoginForm';

export default function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="brand-name">CloudAuth</span>
          <span className="tier-pill">3-Tier Docker Compose Lab</span>
        </div>
      </header>

      <main className="main-content">
        <LoginForm />
      </main>

      <footer className="app-footer">
        <p>React + Nginx &rarr; Express API &rarr; MySQL 8.0</p>
      </footer>
    </div>
  );
}
