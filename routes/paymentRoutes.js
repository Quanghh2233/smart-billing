const express = require('express');
const {
    getPayments,
    getInvoicePayments,
    createPayment,
    deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection middleware to all routes
router.use(protect);

router.route('/')
    .get(getPayments)
    .post(createPayment);

router.route('/:id')
    .delete(deletePayment);

router.route('/invoice/:invoiceId')
    .get(getInvoicePayments);

module.exports = router;
