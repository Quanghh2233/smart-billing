const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Login page (no layout)
router.get('/login', function (req, res) {
    res.render('login', {
        title: 'Login',
        layout: false
    });
});

// Home route - redirect to dashboard if authenticated, otherwise to login
router.get('/', function (req, res) {
    res.redirect('/login');
});

// Protected routes with sidebar layout
router.get('/dashboard', protect, function (req, res) {
    res.render('dashboard', {
        title: 'Bảng điều khiển',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/clients', protect, function (req, res) {
    res.render('clients', {
        title: 'Khách hàng',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/invoices', protect, function (req, res) {
    res.render('invoices', {
        title: 'Hóa đơn',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/invoices/new', protect, function (req, res) {
    res.render('invoice-create', {
        title: 'Tạo hóa đơn',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/invoices/:id', protect, function (req, res) {
    res.render('invoice-detail', {
        title: 'Chi tiết hóa đơn',
        layout: 'layouts/with-sidebar',
        invoiceId: req.params.id
    });
});

router.get('/payments', protect, function (req, res) {
    res.render('payments', {
        title: 'Thanh toán',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/phone-search', protect, function (req, res) {
    res.render('phone-search', {
        title: 'Tìm kiếm SĐT',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/settings', protect, function (req, res) {
    res.render('settings', {
        title: 'Cài đặt',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/users', protect, function (req, res) {
    res.render('users', {
        title: 'Người dùng',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/reports/revenue', protect, function (req, res) {
    res.render('revenue-report', {
        title: 'Báo cáo doanh thu',
        layout: 'layouts/with-sidebar'
    });
});

router.get('/reports/clients', protect, function (req, res) {
    res.render('client-report', {
        title: 'Báo cáo khách hàng',
        layout: 'layouts/with-sidebar'
    });
});

module.exports = router;
