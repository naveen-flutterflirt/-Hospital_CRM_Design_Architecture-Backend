import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Cross-Origin Resource Sharing
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Request Logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Welcome & Health Root Route
app.get('/', (_req, res) => {
  res.json({
    message: '🏥 Hospital CRM Enterprise Backend API',
    version: '1.0.0',
    documentation: '/api/v1/health',
    status: 'ONLINE',
  });
});

// 6. Mount V1 API Routes
app.use('/api/v1', apiRouter);

// 7. Undefined Route 404 Handler
app.use(notFoundHandler);

// 8. Centralized Error Handler
app.use(errorHandler);

export default app;
