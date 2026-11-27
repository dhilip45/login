require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool, checkDbConnection } = require('./config/db');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// Backend service availability check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString(),
  });
});

// MySQL database connectivity check
app.get('/api/db-health', async (req, res) => {
  try {
    await checkDbConnection();
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      host: process.env.DB_HOST || 'database',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API listening on port ${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      console.error('Error closing MySQL pool:', err);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
