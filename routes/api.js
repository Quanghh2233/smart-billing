const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Import controllers
const clientController = require('../controllers/clientController');
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');

// Test if controllers exist and are properly exported
console.log('clientController:', clientController);
console.log('invoiceController:', invoiceController);
console.log('paymentController:', paymentController);

// Client routes - Use direct function references if they exist
router.get('/clients', authMiddleware, clientController.getClients);
router.get('/clients/:id', authMiddleware, clientController.getClientById);
router.post('/clients', authMiddleware, clientController.createClient);
router.put('/clients/:id', authMiddleware, clientController.updateClient);
router.delete('/clients/:id', authMiddleware, clientController.deleteClient);

// Invoice routes
router.get('/invoices', authMiddleware, invoiceController.getInvoices);
router.get('/invoices/:id', authMiddleware, invoiceController.getInvoiceById);
router.post('/invoices', authMiddleware, invoiceController.createInvoice);
router.put('/invoices/:id', authMiddleware, invoiceController.updateInvoice);
router.delete('/invoices/:id', authMiddleware, invoiceController.deleteInvoice);
router.patch('/invoices/:id/status', authMiddleware, invoiceController.updateInvoiceStatus);

// Payment routes
router.get('/payments', authMiddleware, paymentController.getPayments);
router.get('/invoices/:invoiceId/payments', authMiddleware, paymentController.getInvoicePayments);
router.post('/payments', authMiddleware, paymentController.createPayment);
router.delete('/payments/:id', authMiddleware, paymentController.deletePayment);

// Add the missing route for searching bills by phone number
router.get('/bills/phone/:phone', authMiddleware.protect, paymentController.getBillsByPhone);

// Add a test route to verify the router is loaded
router.get('/test', (req, res) => {
    res.json({ message: 'API router is working' });
});

module.exports = router;