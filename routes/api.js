const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const invoiceController = require('../controllers/invoiceController');
const paymentController = require('../controllers/paymentController');

// Client routes
router.get('/clients', clientController.getClients);
router.get('/clients/:id', clientController.getClient);
router.post('/clients', clientController.createClient);
router.put('/clients/:id', clientController.updateClient);
router.delete('/clients/:id', clientController.deleteClient);

// Invoice routes
router.get('/invoices', invoiceController.getInvoices);
router.get('/invoices/:id', invoiceController.getInvoice);
router.post('/invoices', invoiceController.createInvoice);
router.put('/invoices/:id/status', invoiceController.updateInvoiceStatus);
router.delete('/invoices/:id', invoiceController.deleteInvoice);

// Payment routes
router.get('/payments', paymentController.getPayments);
router.get('/invoices/:id/payments', paymentController.getInvoicePayments);
router.post('/payments', paymentController.createPayment);
router.get('/bills/:phone', paymentController.getBillsByPhone);
router.delete('/payments/:id', paymentController.deletePayment);

module.exports = router;