/**
 * Language utilities for translating UI text between English and Vietnamese
 */

// Current language setting (default: 'en') 
let currentLanguage = document.documentElement.getAttribute('data-language') ||
    localStorage.getItem('appLanguage') || 'en';

// Translation dictionary
const translations = {
    // App name
    'Smart Billing': 'Hệ thống Hóa đơn',

    // Common UI elements
    'Search': 'Tìm kiếm',
    'Search by Phone Number': 'Tìm theo Số Điện Thoại',
    'Enter phone number': 'Nhập số điện thoại',
    'Reset': 'Đặt lại',
    'Enter full or partial phone number': 'Nhập số điện thoại đầy đủ hoặc một phần',
    'Language': 'Ngôn ngữ',
    'Phone Search': 'Tìm kiếm SĐT',

    // Navigation
    'Dashboard': 'Bảng điều khiển',
    'Clients': 'Khách hàng',
    'Invoices': 'Hóa đơn',
    'Payments': 'Thanh toán',
    'Reports': 'Báo cáo',
    'Settings': 'Cài đặt',
    'Logout': 'Đăng xuất',
    'User': 'Người dùng',
    'Users': 'Người dùng',

    // Dashboard
    'Revenue Overview': 'Tổng quan Doanh thu',
    'Recent Invoices': 'Hóa đơn Gần đây',
    'Recent Payments': 'Thanh toán Gần đây',
    'Total Revenue': 'Tổng Doanh thu',
    'Pending': 'Chờ xử lý',
    'Overdue': 'Quá hạn',
    'This Month': 'Tháng này',

    // Client related
    'All Clients': 'Tất cả Khách hàng',
    'Add New Client': 'Thêm Khách hàng mới',
    'Client Information': 'Thông tin Khách hàng',
    'Edit Client': 'Chỉnh sửa Khách hàng',
    'Name': 'Tên',
    'Email': 'Email',
    'Phone': 'Điện thoại',
    'Address': 'Địa chỉ',
    'Company': 'Công ty',
    'Save': 'Lưu',
    'Cancel': 'Hủy',
    'Delete': 'Xóa',
    'View': 'Xem',
    'Edit': 'Sửa',
    'Back': 'Quay lại',
    'Client Details': 'Chi tiết Khách hàng',
    'Client History': 'Lịch sử Khách hàng',
    'No clients found': 'Không tìm thấy khách hàng',

    // Invoice related
    'Create Invoice': 'Tạo Hóa đơn',
    'Invoice #': 'Số Hóa đơn',
    'Invoice Details': 'Chi tiết Hóa đơn',
    'Issue Date': 'Ngày phát hành',
    'Due Date': 'Ngày đáo hạn',
    'Total': 'Tổng cộng',
    'Paid': 'Đã thanh toán',
    'Balance': 'Còn lại',
    'Status': 'Trạng thái',
    'Actions': 'Thao tác',
    'Items': 'Các hạng mục',
    'Description': 'Mô tả',
    'Quantity': 'Số lượng',
    'Price': 'Giá',
    'Amount': 'Thành tiền',
    'Subtotal': 'Tổng phụ',
    'Tax': 'Thuế',
    'Add Item': 'Thêm hạng mục',
    'Remove': 'Xóa',
    'Print': 'In',
    'No invoices found': 'Không tìm thấy hóa đơn',

    // Payment related
    'Record Payment': 'Ghi nhận Thanh toán',
    'Payment Date': 'Ngày thanh toán',
    'Payment Method': 'Phương thức thanh toán',
    'Cash': 'Tiền mặt',
    'Bank Transfer': 'Chuyển khoản',
    'Credit Card': 'Thẻ tín dụng',
    'Reference': 'Tham chiếu',
    'Notes': 'Ghi chú',
    'Payment History': 'Lịch sử Thanh toán',
    'No payments found': 'Không tìm thấy thanh toán',

    // Status values
    'paid': 'đã thanh toán',
    'pending': 'chờ thanh toán',
    'overdue': 'quá hạn',
    'partial': 'thanh toán một phần',
    'draft': 'nháp',
    'cancelled': 'đã hủy',

    // Search results
    'invoices found for phone number': 'hóa đơn tìm thấy cho số điện thoại',
    'bills found for phone number': 'hóa đơn tìm thấy cho số điện thoại',
    'No bills found': 'Không tìm thấy hóa đơn',

    // Modals and messages
    'Update Invoice Status': 'Cập nhật Trạng thái Hóa đơn',
    'Update Status': 'Cập nhật Trạng thái',
    'Invoice status updated successfully!': 'Trạng thái hóa đơn đã được cập nhật thành công!',
    'Are you sure you want to delete this invoice?': 'Bạn có chắc chắn muốn xóa hóa đơn này không?',
    'This will also delete all associated items and payments.': 'Điều này cũng sẽ xóa tất cả các mục và thanh toán liên quan.',
    'Invoice deleted successfully!': 'Đã xóa hóa đơn thành công!',
    'An error occurred while updating the status.': 'Đã xảy ra lỗi khi cập nhật trạng thái.',
    'An error occurred while searching for bills': 'Đã xảy ra lỗi khi tìm kiếm hóa đơn',
    'Please enter a phone number to search': 'Vui lòng nhập số điện thoại để tìm kiếm',
    'Are you sure?': 'Bạn có chắc không?',
    'This action cannot be undone.': 'Hành động này không thể hoàn tác.',
    'Client created successfully!': 'Đã tạo khách hàng thành công!',
    'Client updated successfully!': 'Đã cập nhật khách hàng thành công!',
    'Client deleted successfully!': 'Đã xóa khách hàng thành công!',
    'Payment recorded successfully!': 'Đã ghi nhận thanh toán thành công!',
    'Payment deleted successfully!': 'Đã xóa thanh toán thành công!',
    'Settings saved successfully': 'Cài đặt được lưu thành công',
    'An error occurred while saving settings': 'Đã xảy ra lỗi khi lưu cài đặt',
    'Language Settings': 'Cài đặt ngôn ngữ',
    'Select Language': 'Chọn ngôn ngữ',
    'English': 'Tiếng Anh',
    'Vietnamese': 'Tiếng Việt',
    'Save Settings': 'Lưu Cài Đặt',

    // Time periods
    'Today': 'Hôm nay',
    'Yesterday': 'Hôm qua',
    'This Week': 'Tuần này',
    'This Month': 'Tháng này',
    'This Year': 'Năm nay',
    'Last 7 Days': '7 ngày qua',
    'Last 30 Days': '30 ngày qua',
    'Last Month': 'Tháng trước',
    'Last Year': 'Năm trước',
    'All Time': 'Tất cả thời gian',

    // Error messages
    'An error occurred': 'Đã xảy ra lỗi',
    'Please try again': 'Vui lòng thử lại',
    'Required field': 'Trường bắt buộc',
    'Invalid input': 'Nhập liệu không hợp lệ'
};

/**
 * Translates a text string to the current language
 * @param {string} text - The text to translate
 * @returns {string} - Translated text or original if no translation found
 */
function translate(text) {
    if (!text) return '';

    if (currentLanguage === 'en') {
        return text;
    }

    return translations[text] || text;
}

/**
 * Updates UI elements to reflect current language
 */
function updateUI() {
    // Set HTML lang attribute
    document.documentElement.setAttribute('lang', currentLanguage);

    // Update switch state
    const languageSwitch = document.getElementById('language-switch');
    if (languageSwitch) {
        languageSwitch.checked = currentLanguage === 'vi';
    }

    // Update language display text
    const currentLangDisplay = document.getElementById('current-language');
    if (currentLangDisplay) {
        currentLangDisplay.textContent = currentLanguage === 'en' ? 'English' : 'Tiếng Việt';
    }

    // Apply translations
    applyTranslations();
    translateDataTables();
}

/**
 * Changes the application language setting
 * @param {string} lang - Language code ('en' or 'vi')
 * @param {boolean} saveToServer - Whether to save the setting to server
 */
async function changeLanguage(lang, saveToServer = false) {
    if (lang !== 'en' && lang !== 'vi') {
        console.error('Unsupported language:', lang);
        return;
    }

    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);

    // Set cookie for server-side detection (30 days expiry)
    document.cookie = `appLanguage=${lang};path=/;max-age=${30 * 24 * 60 * 60}`;

    // If user is logged in and saveToServer is true, save to user settings
    if (saveToServer) {
        try {
            await apiRequest('/api/user/settings', 'PUT', { language: lang });
        } catch (error) {
            console.error('Error saving language setting to server:', error);
        }
    }

    // Update UI to reflect language change
    updateUI();
}

/**
 * Applies translations to all elements with data-translate attribute
 */
function applyTranslations() {
    // Translate elements with data-translate attribute
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (key) {
            el.textContent = translate(key);
        }
    });

    // Translate placeholders
    const inputElements = document.querySelectorAll('input[data-translate-placeholder]');
    inputElements.forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        if (key) {
            el.placeholder = translate(key);
        }
    });

    // Translate button values
    const buttonElements = document.querySelectorAll('button[data-translate-value], input[type="button"][data-translate-value], input[type="submit"][data-translate-value]');
    buttonElements.forEach(el => {
        const key = el.getAttribute('data-translate-value');
        if (key) {
            el.value = translate(key);
        }
    });

    // Translate select options
    const selectElements = document.querySelectorAll('select');
    selectElements.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.hasAttribute('data-translate')) {
                option.textContent = translate(option.getAttribute('data-translate'));
            }
        });
    });

    // Translate title attributes
    const titledElements = document.querySelectorAll('[data-translate-title]');
    titledElements.forEach(el => {
        const key = el.getAttribute('data-translate-title');
        if (key) {
            el.title = translate(key);
        }
    });
}

/**
 * Translates DataTables components if they exist
 */
function translateDataTables() {
    if ($.fn.dataTable) {
        $.extend(true, $.fn.dataTable.defaults.oLanguage, {
            sEmptyTable: translate('No data available in table'),
            sInfo: translate('Showing _START_ to _END_ of _TOTAL_ entries'),
            sInfoEmpty: translate('Showing 0 to 0 of 0 entries'),
            sInfoFiltered: translate('(filtered from _MAX_ total entries)'),
            sInfoPostFix: '',
            sInfoThousands: ',',
            sLengthMenu: translate('Show _MENU_ entries'),
            sLoadingRecords: translate('Loading...'),
            sProcessing: translate('Processing...'),
            sSearch: translate('Search:'),
            sZeroRecords: translate('No matching records found'),
            oPaginate: {
                sFirst: translate('First'),
                sLast: translate('Last'),
                sNext: translate('Next'),
                sPrevious: translate('Previous')
            },
            oAria: {
                sSortAscending: translate(': activate to sort column ascending'),
                sSortDescending: translate(': activate to sort column descending')
            }
        });

        // Reinitialize any existing tables
        $('.dataTable').each(function () {
            const table = $(this).DataTable();
            table.draw();
        });
    }
}

/**
 * Format date according to current language
 * @param {string} dateStr - The date string
 * @returns {string} - Formatted date string
 */
function formatDate(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };

    if (currentLanguage === 'vi') {
        // Vietnamese date format: DD/MM/YYYY
        return date.toLocaleDateString('vi-VN', options);
    } else {
        // Default format for English: MM/DD/YYYY
        return date.toLocaleDateString('en-US', options);
    }
}

/**
 * Format currency according to current language
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '';

    const options = {
        style: 'currency',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    };

    if (currentLanguage === 'vi') {
        // Vietnamese currency format with VND
        options.currency = 'VND';
        return new Intl.NumberFormat('vi-VN', options).format(amount);
    } else {
        // Default format for English with USD
        options.currency = 'USD';
        return new Intl.NumberFormat('en-US', options).format(amount);
    }
}

// Initialize translations when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up language switch in sidebar
    const languageSwitch = document.getElementById('language-switch');
    if (languageSwitch) {
        // Set initial state based on current language
        languageSwitch.checked = currentLanguage === 'vi';

        // Add event listener for switch toggle
        languageSwitch.addEventListener('change', (e) => {
            const newLang = e.target.checked ? 'vi' : 'en';
            changeLanguage(newLang, true);
        });
    }

    // Initial UI update
    updateUI();
});

// Export functions for use in other files
window.translate = translate;
window.changeLanguage = changeLanguage;
window.applyTranslations = applyTranslations;
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.getCurrentLanguage = () => currentLanguage;