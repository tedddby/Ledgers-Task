const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/companies/:id/transactions', transactionRoutes);
app.use('/api/companies/:id/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
