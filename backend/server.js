const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase, getDbType } = require('./config/db');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const masterRoutes = require('./routes/master');
const reportRoutes = require('./routes/reports');
const schemaRoutes = require('./routes/schema');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api', masterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/schema', schemaRoutes);

// Health check & System Info
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: getDbType(),
        project: 'Campus Maintenance Ticket System (P17)'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error: ' + err.message
    });
});

// Boot server after database initialization
initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`=======================================================`);
            console.log(` Campus Maintenance System Backend running on port ${PORT}`);
            console.log(` Active Database Engine: ${getDbType().toUpperCase()}`);
            console.log(` Health check: http://localhost:${PORT}/api/health`);
            console.log(`=======================================================`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database and start server:', err);
        process.exit(1);
    });
