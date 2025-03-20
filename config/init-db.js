const db = require('./database');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`Created data directory: ${dataDir}`);
    } catch (err) {
        console.error(`Failed to create data directory: ${dataDir}`, err);
        process.exit(1); // Exit if we can't create the directory
    }
}

// Make sure we have database connection
if (!db) {
    console.error('Database connection failed. Cannot initialize database.');
    process.exit(1);
}

console.log('Initializing database tables...');

// Create tables
db.serialize(() => {
    // Users table
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Clients table
    db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Invoices table
    db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      number TEXT UNIQUE NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

    // Invoice items table
    db.run(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      amount REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    )
  `);

    // Payments table
    db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_method TEXT NOT NULL,
      reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    )
  `);

    console.log('Database initialized successfully');
});

// Create admin user
const bcrypt = require('bcrypt');
const adminPassword = bcrypt.hashSync('admin123', 10);

db.get("SELECT * FROM users WHERE email = 'admin@example.com'", (err, user) => {
    if (err) {
        console.error('Error checking for admin user:', err);
        return;
    }

    if (!user) {
        db.run(
            `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
            ['admin', 'admin@example.com', adminPassword, 'admin'],
            function (err) {
                if (err) {
                    console.error('Error creating admin user:', err);
                } else {
                    console.log('Admin user created successfully');
                }
            }
        );
    } else {
        console.log('Admin user already exists');
    }
});
