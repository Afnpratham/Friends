/**
 * FRIENDS Backend — Express Application Entry Point
 * Framework for Rapid Intelligent Execution, Networking, Design, and Strategy
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import agentRoutes from './routes/agents';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { enhanceProjectPrompt, getClarifyingQuestions } from './controllers/executeController';

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 AI calls per minute
  message: { data: null, error: 'AI rate limit exceeded. Please wait before running more agents.' },
});

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'FRIENDS Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Public Routes ──────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Protected Routes (require auth) ───────────────────────────────────────
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/agents', authMiddleware, agentRoutes);

// AI-specific endpoints with stricter rate limiting
app.post('/api/clarify', authMiddleware, aiLimiter, getClarifyingQuestions);
app.post('/api/enhance-prompt', authMiddleware, aiLimiter, enhanceProjectPrompt);

// ── Error Handling ─────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │     🤖 FRIENDS Backend is running       │
  │     Port: ${PORT}                            │
  │     Env:  ${process.env.NODE_ENV || 'development'}                 │
  │     Health: http://localhost:${PORT}/health  │
  └─────────────────────────────────────────┘
  `);
});

export default app;
