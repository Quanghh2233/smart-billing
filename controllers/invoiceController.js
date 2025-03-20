const db = require('../config/database');

// Get all invoices
exports.getInvoices = (req, res) => {
    const query = `
    SELECT i.*, c.name as client_name 
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
  `;

    db.all(query, (err, invoices) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    });
};

// Get single invoice with items
exports.getInvoice = (req, res) => {
    const invoiceQuery = `
    SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `;

    const itemsQuery = `
    SELECT * FROM invoice_items WHERE invoice_id = ?
  `;

    const paymentsQuery = `
    SELECT * FROM payments WHERE invoice_id = ?
  `;

    db.get(invoiceQuery, [req.params.id], (err, invoice) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        db.all(itemsQuery, [req.params.id], (err, items) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            db.all(paymentsQuery, [req.params.id], (err, payments) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                // Calculate total paid amount
                const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

                res.status(200).json({
                    success: true,
                    data: {
                        ...invoice,
                        items,
                        payments,
                        totalPaid,
                        balance: invoice.total_amount - totalPaid
                    }
                });
            });
        });
    });
};

// Create new invoice
exports.createInvoice = (req, res) => {
    const {
        client_id,
        number,
        issue_date,
        due_date,
        total_amount,
        notes,
        items
    } = req.body;

    if (!client_id || !number || !issue_date || !due_date || !items || !items.length) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Start a transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            `INSERT INTO invoices (client_id, number, issue_date, due_date, total_amount, status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [client_id, number, issue_date, due_date, total_amount, 'pending', notes],
            function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                const invoice_id = this.lastID;
                let itemsProcessed = 0;

                // Insert invoice items
                items.forEach(item => {
                    db.run(
                        `INSERT INTO invoice_items (invoice_id, description, quantity, price, amount) 
             VALUES (?, ?, ?, ?, ?)`,
                        [invoice_id, item.description, item.quantity, item.price, item.amount],
                        (err) => {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({
                                    success: false,
                                    message: 'Database error',
                                    error: err.message
                                });
                            }

                            itemsProcessed++;

                            if (itemsProcessed === items.length) {
                                db.run('COMMIT');
                                res.status(201).json({
                                    success: true,
                                    message: 'Invoice created successfully',
                                    data: {
                                        invoice_id
                                    }
                                });
                            }
                        }
                    );
                });
            }
        );
    });
};

// Update invoice status
exports.updateInvoiceStatus = (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Invoice ID is required'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Please provide status'
            });
        }

        if (!['draft', 'pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        // First check if invoice exists
        db.get('SELECT id FROM invoices WHERE id = ?', [id], (err, invoice) => {
            if (err) {
                console.error('Error checking invoice existence:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error while checking invoice',
                    error: err.message
                });
            }

            if (!invoice) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found'
                });
            }

            // Update invoice status
            db.run(
                `UPDATE invoices SET 
                status = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [status, id],
                function (err) {
                    if (err) {
                        console.error('Error updating invoice status:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Database error while updating status',
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Invoice not found'
                        });
                    }

                    res.status(200).json({
                        success: true,
                        message: 'Invoice status updated successfully'
                    });
                }
            );
        });
    } catch (error) {
        console.error('Exception in updateInvoiceStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Delete invoice
exports.deleteInvoice = (req, res) => {
    // Start a transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Delete invoice items first
        db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [req.params.id], (err) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            // Delete payments
            db.run('DELETE FROM payments WHERE invoice_id = ?', [req.params.id], (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                // Delete the invoice
                db.run('DELETE FROM invoices WHERE id = ?', [req.params.id], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
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
                            message: 'Invoice not found'
                        });
                    }

                    db.run('COMMIT');
                    res.status(200).json({
                        success: true,
                        message: 'Invoice deleted successfully'
                    });
                });
            });
        });
    });
};
