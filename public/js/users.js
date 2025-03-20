document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    // Check if user is admin
    if (auth.user.role !== 'admin') {
        window.location.href = '/dashboard';
        return;
    }

    // Delay loading users a bit to ensure DOM is fully ready
    setTimeout(() => {
        loadUsers();
    }, 100);

    // Setup event listeners
    document.getElementById('save-user').addEventListener('click', addUser);
    document.getElementById('update-user').addEventListener('click', updateUser);
});

let usersTable;

async function loadUsers() {
    try {
        console.log('Loading users...');
        const result = await apiRequest('/api/users');

        if (!result) {
            console.error('Failed to load users: No response from server');
            return;
        }

        if (!result.success) {
            console.error('Failed to load users:', result.message);
            return;
        }

        // Clear table before reloading
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';

        // Destroy existing DataTable if it exists
        if (usersTable && $.fn.DataTable.isDataTable('#usersTable')) {
            usersTable.destroy();
        }

        const users = result.data;
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        users.forEach(user => {
            const row = document.createElement('tr');

            const usernameCell = document.createElement('td');
            usernameCell.textContent = user.username;

            const emailCell = document.createElement('td');
            emailCell.textContent = user.email;

            const roleCell = document.createElement('td');
            const roleBadge = document.createElement('span');
            roleBadge.className = user.role === 'admin' ? 'badge bg-primary' : 'badge bg-secondary';
            roleBadge.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            roleCell.appendChild(roleBadge);

            const createdCell = document.createElement('td');
            createdCell.textContent = formatDate(user.created_at);

            const actionsCell = document.createElement('td');

            // Add edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary me-2';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => editUser(user));
            actionsCell.appendChild(editBtn);

            // Don't allow deletion of own account
            if (user.id !== currentUser.id) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-outline-danger';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.addEventListener('click', () => deleteUser(user.id, user.username));
                actionsCell.appendChild(deleteBtn);
            }

            row.appendChild(usernameCell);
            row.appendChild(emailCell);
            row.appendChild(roleCell);
            row.appendChild(createdCell);
            row.appendChild(actionsCell);

            usersList.appendChild(row);
        });

        // Initialize DataTable
        usersTable = $('#usersTable').DataTable({
            order: [[0, 'asc']],
            responsive: true,
            language: {
                emptyTable: "No users found"
            }
        });

    } catch (error) {
        console.error('Error loading users:', error);
        alert('Error loading users. Check console for details.');
    }
}

async function addUser() {
    const username = document.getElementById('new-username').value.trim();
    const email = document.getElementById('new-email').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-role').value;

    if (!username || !email || !password || !role) {
        alert('Please fill all required fields');
        return;
    }

    try {
        const userData = { username, email, password, role };

        // Add loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(loadingOverlay);

        const result = await apiRequest('/api/users', 'POST', userData);

        document.body.removeChild(loadingOverlay);

        if (result.success) {
            alert('User created successfully!');
            $('#addUserModal').modal('hide');
            document.getElementById('add-user-form').reset();
            await loadUsers();
        } else {
            alert('Error: ' + (result.message || 'Failed to create user'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('An error occurred while creating the user');
    }
}

function editUser(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-role').value = user.role;

    $('#editUserModal').modal('show');
}

async function updateUser() {
    const userId = document.getElementById('edit-user-id').value;
    const username = document.getElementById('edit-username').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const role = document.getElementById('edit-role').value;

    if (!username || !email || !role) {
        alert('Please fill all required fields');
        return;
    }

    try {
        const userData = { username, email, role };

        // Add loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(loadingOverlay);

        const result = await apiRequest(`/api/users/${userId}`, 'PUT', userData);

        document.body.removeChild(loadingOverlay);

        if (result.success) {
            alert('User updated successfully!');
            $('#editUserModal').modal('hide');

            // Update local storage if user updated their own profile
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (currentUser.id === parseInt(userId)) {
                currentUser.username = username;
                currentUser.email = email;
                currentUser.role = role;
                localStorage.setItem('user', JSON.stringify(currentUser));
                document.getElementById('username').textContent = username;
            }

            await loadUsers();
        } else {
            alert('Error: ' + (result.message || 'Failed to update user'));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('An error occurred while updating the user');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
        return;
    }

    try {
        // Add loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
        document.body.appendChild(loadingOverlay);

        const result = await apiRequest(`/api/users/${userId}`, 'DELETE');

        document.body.removeChild(loadingOverlay);

        if (result.success) {
            alert('User deleted successfully!');
            await loadUsers();
        } else {
            alert('Error: ' + (result.message || 'Failed to delete user'));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred while deleting the user');
    }
}
