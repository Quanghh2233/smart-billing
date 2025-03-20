// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = '/';
        return false;
    }

    // Set username in navbar
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = user.username || 'User';
    }

    // Show admin sections if user is admin
    if (user.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }

    // Add active class to current nav item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href) && href !== '/') {
            link.classList.add('active');
        }
    });

    // Add logout event listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && !logoutBtn.hasEventListener) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
        logoutBtn.hasEventListener = true;
    }

    return { token, user };
}

// Function to make authenticated API requests
async function apiRequest(url, method = 'GET', data = null) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/';
        return;
    }

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data);
    }

    try {
        console.log(`Making ${method} request to ${url}`);
        const response = await fetch(url, options);

        if (response.status === 401) {
            // Unauthorized, token might be expired
            console.error('Xác thực thất bại (401)');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return;
        }

        if (response.status === 403) {
            console.error('Truy cập bị từ chối (403)');
            alert('Bạn không có quyền truy cập vào tài nguyên này.');
            return;
        }

        if (response.status === 404) {
            console.error('Không tìm thấy tài nguyên (404)');
            return { success: false, message: 'Không tìm thấy tài nguyên' };
        }

        return await response.json();
    } catch (error) {
        console.error('Lỗi yêu cầu API:', error);
        return { success: false, message: 'Lỗi kết nối' };
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status) {
        case 'paid': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'overdue': return 'bg-danger';
        case 'draft': return 'bg-secondary';
        case 'cancelled': return 'bg-light text-dark';
        default: return 'bg-secondary';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', checkAuth);
