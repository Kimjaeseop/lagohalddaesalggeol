import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import router from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS (restrict to known origins) ────────────────────────────────────────
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server / Postman (no origin header)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

// ─── Rate Limiting (inline, no package needed) ───────────────────────────────
const rateLimitStore = new Map(); // IP -> { count, resetAt }

const rateLimit = ({ windowMs, max, message }) => (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
        rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
        return next();
    }

    if (entry.count >= max) {
        return res.status(429).json({ error: message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
    }

    entry.count++;
    next();
};

// General: 100 req / 15 min per IP
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// AI analysis: 20 req / 1 hr per IP (expensive)
const analysisLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, message: '분석 요청 한도에 도달했습니다. 1시간 후 다시 시도해주세요.' });

app.use('/api', generalLimiter);
app.use('/api/analyze', analysisLimiter);
app.use('/api/tweet/analyze', analysisLimiter);

import benchmarkRouter from './routes/benchmark.js';

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', router);
app.use('/api/benchmark', benchmarkRouter);

// Health Check
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'Regret Calculator API is running' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Access denied' });
    }
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const startServer = async () => {
    try {
        await initDb();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();
