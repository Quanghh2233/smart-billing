/**
 * Translate API response messages if needed
 * @param {Object} req - Express request object
 * @param {Object} response - API response object
 * @returns {Object} - Translated response object
 */
exports.translateApiResponse = (req, response) => {
    // Check for user's preferred language from various sources
    // Priority: user settings > query param > cookie > header > default
    const userLanguage = req.user?.language;
    const cookieLang = getCookieValue(req.headers.cookie, 'appLanguage');
    const queryLang = req.query.lang;
    const headerLang = req.headers['accept-language']?.substring(0, 2);

    const lang = userLanguage || queryLang || cookieLang || headerLang || 'en';

    if (lang !== 'vi') {
        return response; // Return as-is for all non-Vietnamese
    }

    // Handle Vietnamese translation
    return translateToVietnamese(response);
};

/**
 * Helper function to extract cookie value
 */
function getCookieValue(cookieString, cookieName) {
    if (!cookieString) return null;

    const match = cookieString.match(new RegExp(`${cookieName}=([^;]+)`));
    return match ? match[1] : null;
}

/**
 * Translate API response messages to Vietnamese
 * @param {Object} response - API response object
 * @returns {Object} - Translated response object
 */
function translateToVietnamese(response) {
    if (!response) return response;

    const translations = {
        'Database error': 'Lỗi cơ sở dữ liệu',
        'Missing required fields': 'Thiếu trường bắt buộc',
        'Invoice not found': 'Không tìm thấy hóa đơn',
        'Payment recorded successfully': 'Ghi nhận thanh toán thành công',
        'Payment amount exceeds the remaining balance': 'Số tiền thanh toán vượt quá số dư còn lại',
        'Payment not found': 'Không tìm thấy thanh toán',
        'Payment deleted successfully': 'Xóa thanh toán thành công',
        'Client not found': 'Không tìm thấy khách hàng',
        'Phone number is required': 'Yêu cầu nhập số điện thoại'
    };

    const result = { ...response };

    // Translate message if it exists
    if (result.message && translations[result.message]) {
        result.message = translations[result.message];
    }

    return result;
}
