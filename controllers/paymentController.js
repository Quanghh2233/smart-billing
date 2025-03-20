const db = require('../config/database');

// Get all payments
exports.getPayments = (req, res) => {
    const query = `
    SELECT p.*, i.number as invoice_number, c.name as client_name
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN clients c ON i.client_id = c.id
    ORDER BY p.payment_date DESC
  `;

    db.all(query, (err, payments) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    });
};

// Get payments for a specific invoice
exports.getInvoicePayments = (req, res) => {
    const query = `
    SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC
  `;

    db.all(query, [req.params.invoiceId], (err, payments) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });
    });
};

// Record a new payment
exports.createPayment = (req, res) => {
    const {
        invoice_id,
        amount,
        payment_date,
        payment_method,
        reference,
        notes
    } = req.body;

    if (!invoice_id || !amount || !payment_date || !payment_method) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields'
        });
    }

    // Verify invoice exists and get its details
    db.get('SELECT * FROM invoices WHERE id = ?', [invoice_id], (err, invoice) => {
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

        // Get total payments made so far
        db.get('SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?', [invoice_id], (err, result) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            const totalPaid = result.total_paid || 0;
            const newTotal = totalPaid + parseFloat(amount);

            // Ensure payment doesn't exceed invoice amount
            if (newTotal > invoice.total_amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment amount exceeds the remaining balance'
                });
            }

            // Record the payment
            db.run(
                `INSERT INTO payments (invoice_id, amount, payment_date, payment_method, reference, notes) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [invoice_id, amount, payment_date, payment_method, reference, notes],
                function (err) {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Database error',
                            error: err.message
                        });
                    }

                    // Update invoice status if fully paid
                    if (newTotal >= invoice.total_amount) {
                        db.run('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                            ['paid', invoice_id]);
                    }

                    res.status(201).json({
                        success: true,
                        message: 'Payment recorded successfully',
                        data: {
                            id: this.lastID,
                            invoice_id,
                            amount,
                            payment_date,
                            payment_method,
                            reference,
                            notes
                        }
                    });
                }
            );
        });
    });
};

// Get bills (invoices) by phone number
exports.getBillsByPhone = (req, res) => {
    const phoneNumber = req.params.phone;

    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: 'Phone number is required'
        });
    }

    console.log(`Searching for bills with phone number: ${phoneNumber}`);

    const query = `
    SELECT i.*, c.name as client_name, c.phone as client_phone,
           (SELECT SUM(amount) FROM payments WHERE invoice_id = i.id) as paid_amount
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    WHERE c.phone LIKE ?
    ORDER BY i.issue_date DESC
    `;

    db.all(query, [`%${phoneNumber}%`], (err, invoices) => {
        if (err) {
            console.error('Error in getBillsByPhone:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err.message
            });
        }

        console.log(`Found ${invoices.length} invoices matching phone: ${phoneNumber}`);

        // Calculate balance for each invoice
        invoices.forEach(invoice => {
            invoice.paid_amount = invoice.paid_amount || 0;
            invoice.balance = invoice.total_amount - invoice.paid_amount;
        });

        res.status(200).json({
            success: true,
            count: invoices.length,
            data: invoices
        });
    });
};

// Delete payment
exports.deletePayment = (req, res) => {
    // Start a transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get payment details first
        db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], (err, payment) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: err.message
                });
            }

            if (!payment) {
                db.run('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Payment not found'
                });
            }

            // Delete the payment
            db.run('DELETE FROM payments WHERE id = ?', [req.params.id], function (err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({
                        success: false,
                        message: 'Database error',
                        error: err.message
                    });
                }

                // Update the invoice status if needed
                db.get('SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = ?',
                    [payment.invoice_id], (err, result) => {

                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({
                                success: false,
                                message: 'Database error',
                                error: err.message
                            });
                        }

                        const totalPaid = result.total_paid || 0;

                        // Get invoice details
                        db.get('SELECT * FROM invoices WHERE id = ?', [payment.invoice_id], (err, invoice) => {
                            if (err || !invoice) {
                                db.run('ROLLBACK');
                                return res.status(500).json({
                                    success: false,
                                    message: 'Database error',
                                    error: err ? err.message : 'Invoice not found'
                                });
                            }

                            // Determine new status
                            let newStatus = invoice.status;
                            if (totalPaid <= 0) {
                                newStatus = 'pending';
                            } else if (totalPaid < invoice.total_amount) {
                                newStatus = 'partial';
                            }

                            // Update invoice status
                            db.run('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                                [newStatus, payment.invoice_id], (err) => {

                                    if (err) {
                                        db.run('ROLLBACK');
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Database error',
                                            error: err.message
                                        });
                                    }

                                    db.run('COMMIT');
                                    res.status(200).json({
                                        success: true,
                                        message: 'Payment deleted successfully'
                                    });
                                });
                        });
                    });
            });
        });
    });
};
