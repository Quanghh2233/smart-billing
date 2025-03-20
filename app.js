const express = require('express');
const path = require('path');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
    } catch (err) {
        console.error(`Failed to create data directory: ${dataDir}`, err);
    }
}

// Initialize the database connection
require('./config/database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Add the main API router
app.use('/api', require('./routes/api'));

// Frontend routes
app.use('/', require('./routes/viewRoutes'));

// Error handler
app.use((err, req, res, next) => {
    console.error('Error details:', err);
    console.error('Stack trace:', err.stack);

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? `Error: ${err.message}` : 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
