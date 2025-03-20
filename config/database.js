const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
    } catch (err) {
        console.error(`Failed to create data directory: ${dataDir}`, err);
    }
}

const dbPath = path.resolve(__dirname, '../data/billing.db');
console.log(`Database path: ${dbPath}`);

let db;
try {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Could not connect to database', err);
            console.error('Database path:', dbPath);
            console.error('Current working directory:', process.cwd());
            console.error('Directory exists?', fs.existsSync(path.dirname(dbPath)));
            console.error('File exists?', fs.existsSync(dbPath));
            console.error('Directory permissions:', fs.statSync(dataDir).mode.toString(8));
        } else {
            console.log('Connected to SQLite database');
        }
    });
} catch (err) {
    console.error('Exception while creating database connection:', err);
}

module.exports = db;
