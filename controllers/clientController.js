const db = require('../config/database');

// Get all clients
exports.getClients = (req, res) => {
    db.all('SELECT * FROM clients ORDER BY created_at DESC', (err, clients) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.status(200).json({
            success: true,
            count: clients.length,
            data: clients
        });
    });
};

// Get single client
exports.getClient = (req, res) => {
    db.get('SELECT * FROM clients WHERE id = ?', [req.params.id], (err, client) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (!client) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        res.status(200).json({
            success: true,
            data: client
        });
    });
};

// Create new client
exports.createClient = (req, res) => {
    try {
        const { name, email, phone, address, company } = req.body;

        console.log('Received client data:', { name, email, phone, address, company });

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide client name'
            });
        }

        // Check if email is provided and unique
        if (email) {
            // First check if client with same email already exists
            db.get('SELECT id FROM clients WHERE email = ?', [email], (err, existingClient) => {
                if (err) {
                    console.error('Database error checking email:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Database error while checking email',
                        error: err.message
                    });
                }

                if (existingClient) {
                    return res.status(400).json({
                        success: false,
                        message: 'A client with this email already exists'
                    });
                }

                // If email is unique, proceed with client creation
                insertClient();
            });
        } else {
            // If no email provided, directly create client
            insertClient();
        }

        // Function to insert the client into the database
        function insertClient() {
            console.log('Inserting client into database');

            // Use null for empty strings to avoid SQLite issues
            const emailValue = email && email.trim() !== '' ? email : null;
            const phoneValue = phone && phone.trim() !== '' ? phone : null;
            const addressValue = address && address.trim() !== '' ? address : null;
            const companyValue = company && company.trim() !== '' ? company : null;

            db.run(
                `INSERT INTO clients (name, email, phone, address, company) 
                 VALUES (?, ?, ?, ?, ?)`,
                [name, emailValue, phoneValue, addressValue, companyValue],
                function (err) {
                    if (err) {
                        console.error('Database error inserting client:', err);

                        return res.status(500).json({
                            success: false,
                            message: 'Database error while creating client',
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        success: true,
                        data: {
                            id: this.lastID,
                            name,
                            email: emailValue,
                            phone: phoneValue,
                            address: addressValue,
                            company: companyValue
                        }
                    });
                }
            );
        }
    } catch (error) {
        console.error('Exception in createClient:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function to validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Update client
exports.updateClient = (req, res) => {
    const { name, email, phone, address, company } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: 'Please provide client name'
        });
    }

    db.run(
        `UPDATE clients SET 
     name = ?, 
     email = ?, 
     phone = ?,
     address = ?,  
     company = ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [name, email, phone, address, company, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Client updated successfully'
            });
        }
    );
};

// Delete client
exports.deleteClient = (req, res) => {
    // Extract cascade parameter (default: false)
    const cascade = req.query.cascade === 'true';

    // Check if client has related data
    db.get(
        `SELECT COUNT(*) as count FROM invoices WHERE client_id = ?`,
        [req.params.id],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (result.count > 0 && !cascade) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete client with existing invoices. Use cascade=true to delete all related data or delete invoices first.'
                });
            }

            // If no related invoices or cascade=true, proceed with deletion
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // If cascade=true, delete all related data
                if (cascade) {
                    // 1. Delete payments related to client's invoices
                    db.run(`
                        DELETE FROM payments 
                        WHERE invoice_id IN (
                            SELECT id FROM invoices WHERE client_id = ?
                        )`, [req.params.id], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({
                                success: false,
                                message: 'Error deleting related payments',
                                error: err.message
                            });
                        }

                        // 2. Delete invoice items
                        db.run(`
                            DELETE FROM invoice_items 
                            WHERE invoice_id IN (
                                SELECT id FROM invoices WHERE client_id = ?
                            )`, [req.params.id], (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error deleting related invoice items',
                                    error: err.message
                                });
                            }

                            // 3. Delete invoices
                            db.run('DELETE FROM invoices WHERE client_id = ?', [req.params.id], (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error deleting related invoices',
                                        error: err.message
                                    });
                                }

                                // 4. Finally delete the client
                                deleteClientRecord();
                            });
                        });
                    });
                } else {
                    // Just delete the client if no cascade needed
                    deleteClientRecord();
                }

                // Helper function to delete the client record
                function deleteClientRecord() {
                    db.run('DELETE FROM clients WHERE id = ?', [req.params.id], function (err) {
                        if (err) {
                            db.run('ROLLBACK');
                            console.error('Error deleting client:', err);
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        if (this.changes === 0) {
                            db.run('ROLLBACK');
                            return res.status(404).json({
                                success: false,
                                message: 'Client not found'
                            });
                        }

                        db.run('COMMIT');
                        res.status(200).json({
                            success: true,
                            message: 'Client deleted successfully'
                        });
                    });
                }
            });
        }
    );
};
