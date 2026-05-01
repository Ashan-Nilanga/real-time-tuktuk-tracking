import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { pool, initDB } from './config/db.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();

    await initDB();

    app.listen(PORT, () => {
      console.log(`TukTuk Tracking API running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
      console.log(`Health check at http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});

startServer();
