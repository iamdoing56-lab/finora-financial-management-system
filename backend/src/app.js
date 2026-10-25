const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Load environment variables (must be before any env access)
require('dotenv').config();

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const accountsRoutes     = require('./routes/accounts');
const transactionsRoutes = require('./routes/transactions');
const categoriesRoutes   = require('./routes/categories');
const budgetsRoutes      = require('./routes/budgets');
const reportsRoutes      = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes        = require('./routes/admin');

// ─── App Initialization ─────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ────────────────────────────────────────────────────

// helmet() sets a collection of secure HTTP headers automatically
// (e.g., X-Frame-Options, X-XSS-Protection, Content-Security-Policy)
app.use(helmet());

// CORS: only allow requests from the configured frontend origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // allow cookies if needed in future
}));

// ─── Body Parsing Middleware ────────────────────────────────────────────────

// Parse incoming JSON request bodies (needed for POST/PUT endpoints)
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth',          authRoutes);
app.use('/api/accounts',      accountsRoutes);
app.use('/api/transactions',  transactionsRoutes);
app.use('/api/categories',    categoriesRoutes);
app.use('/api/budgets',       budgetsRoutes);
app.use('/api/reports',       reportsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin',         adminRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Finora API is running' });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────

// Catches any route that doesn't match the ones above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Global Error Handler ────────────────────────────────────────────────────

// Express identifies a 4-argument function as an error handler.
// Any route can call next(error) to reach here.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);

  // Don't leak internal error details to the client in production
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred.'
    : err.message || 'An internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

module.exports = app;
