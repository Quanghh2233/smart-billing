const express = require('express');
const {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);

router.route('/')
    .get(getInvoices)
    .post(createInvoice);

router.route('/:id')
    .get(getInvoice)
    .delete(deleteInvoice);

router.route('/:id/status')
    .patch(updateInvoiceStatus);

module.exports = router;
