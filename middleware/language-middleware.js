/**
 * Middleware for language detection and selection
 */
module.exports = (req, res, next) => {
    // Since we don't have express-session, we'll just use the cookie directly
    const cookieLang = getCookieValue(req.headers.cookie, 'appLanguage');
    const queryLang = req.query.lang;
    const headerLang = req.headers['accept-language']?.substring(0, 2);

    // Thứ tự ưu tiên: query > cookie > header > default
    const lang = queryLang || cookieLang || headerLang || 'en';

    // Chỉ chấp nhận các ngôn ngữ được hỗ trợ
    const currentLanguage = (lang === 'vi') ? 'vi' : 'en';

    // Thêm ngôn ngữ vào res.locals cho views
    res.locals.currentLanguage = currentLanguage;

    next();
};

/**
 * Helper function to extract cookie value
 */
function getCookieValue(cookieString, cookieName) {
    if (!cookieString) return null;

    const match = cookieString.match(new RegExp(`${cookieName}=([^;]+)`));
    return match ? match[1] : null;
}
