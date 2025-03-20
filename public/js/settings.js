document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    await loadUserProfile();

    if (auth.user.role === 'admin') {
        await loadUsers();
    }

    // Setup event listeners
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    document.getElementById('password-form').addEventListener('submit', updatePassword);

    if (auth.user.role === 'admin') {
        document.getElementById('add-user-btn').addEventListener('click', () => $('#addUserModal').modal('show'));
        document.getElementById('save-user').addEventListener('click', addUser);
    }
});

async function loadUserProfile() {
    try {
        const result = await apiRequest('/api/auth/me');

        if (!result.success) {
            console.error('Failed to load user profile:', result.message);
            return;
        }

        const user = result.data;

        // Populate profile form
        document.getElementById('username').value = user.username;
        document.getElementById('email').value = user.email;

    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!username || !email) {
        alert('Vui lòng nhập cả tên người dùng và email.');
        return;
    }

    try {
        const userData = { username, email };
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const result = await apiRequest(`/api/users/${user.id}`, 'PUT', userData);

        if (result.success) {
            alert('Cập nhật hồ sơ thành công!');

            // Update local storage user data
            user.username = username;
            user.email = email;
            localStorage.setItem('user', JSON.stringify(user));

            // Update navbar username
            document.querySelector('#username').textContent = username;
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể cập nhật hồ sơ.'));
        }
    } catch (error) {
        console.error('Lỗi cập nhật hồ sơ:', error);
        alert('Đã xảy ra lỗi khi cập nhật hồ sơ của bạn.');
    }
}

async function updatePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Vui lòng điền vào tất cả các trường mật khẩu.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới không khớp.');
        return;
    }

    if (newPassword.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }

    try {
        // In a real implementation, we'd validate the current password on the server
        // For this example, we'll just send the new password
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const result = await apiRequest(`/api/users/${user.id}/password`, 'PATCH', { password: newPassword });

        if (result.success) {
            alert('Đổi mật khẩu thành công!');
            document.getElementById('password-form').reset();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể đổi mật khẩu.'));
        }
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        alert('Đã xảy ra lỗi khi đổi mật khẩu của bạn.');
    }
}

async function loadUsers() {
    try {
        const result = await apiRequest('/api/users');

        if (!result.success) {
            console.error('Failed to load users:', result.message);
            return;
        }

        const users = result.data;
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        users.forEach(user => {
            const row = document.createElement('tr');

            const usernameCell = document.createElement('td');
            usernameCell.textContent = user.username;

            const emailCell = document.createElement('td');
            emailCell.textContent = user.email;

            const roleCell = document.createElement('td');
            roleCell.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

            const actionsCell = document.createElement('td');

            // Don't allow deletion of own account
            if (user.id !== currentUser.id) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.addEventListener('click', () => deleteUser(user.id, user.username));
                actionsCell.appendChild(deleteBtn);
            }

            row.appendChild(usernameCell);
            row.appendChild(emailCell);
            row.appendChild(roleCell);
            row.appendChild(actionsCell);

            usersList.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function addUser() {
    const username = document.getElementById('new-username').value.trim();
    const email = document.getElementById('new-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-role').value;

    if (!username || !email || !password) {
        alert('Vui lòng nhập tên người dùng, email và mật khẩu.');
        return;
    }

    try {
        const userData = { username, email, password, role };
        const result = await apiRequest('/api/users', 'POST', userData);

        if (result.success) {
            alert('Tạo người dùng thành công!');
            $('#addUserModal').modal('hide');
            document.getElementById('add-user-form').reset();
            await loadUsers();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể tạo người dùng.'));
        }
    } catch (error) {
        console.error('Lỗi tạo người dùng:', error);
        alert('Đã xảy ra lỗi khi tạo người dùng.');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng ${username}?`)) {
        return;
    }

    try {
        const result = await apiRequest(`/api/users/${userId}`, 'DELETE');

        if (result.success) {
            alert('Đã xóa người dùng thành công!');
            await loadUsers();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể xóa người dùng.'));
        }
    } catch (error) {
        console.error('Lỗi xóa người dùng:', error);
        alert('Đã xảy ra lỗi khi xóa người dùng.');
    }
}
