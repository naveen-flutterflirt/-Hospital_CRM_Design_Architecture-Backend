import app from './app.js';
import { env } from './config/env.js';
import { pool, checkConnection } from './config/db.js';
import { runMigrations } from './database/migrate.js';
import { seedAdminUser, seedPatients, seedDoctors, seedAppointments, seedLeads, seedFeedbacks } from './database/seed.js';

const PORT = env.PORT;

async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${env.NODE_ENV}]`);
  });

  // Verify and seed database asynchronously without blocking HTTP listener
  checkConnection()
    .then(async (dbStatus) => {
      if (dbStatus.connected) {
        try {
          await runMigrations();
          await seedAdminUser();
          await seedPatients();
          await seedDoctors();
          await seedAppointments();
          await seedLeads();
          await seedFeedbacks();
          console.log(`Database connected: ${dbStatus.database}`);
        } catch (err) {
          console.error('Database initialization error:', err.message);
        }
      } else {
        console.warn(`Database connection failed: ${dbStatus.message || dbStatus.error}`);
      }
    })
    .catch((err) => {
      console.error('Database check error:', err.message);
    });

  const handleShutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down server...`);
    server.close(async () => {
      try {
        await pool.end();
      } catch (err) {
        console.error('Error closing database pool:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('Server startup error:', error);
  process.exit(1);
});

