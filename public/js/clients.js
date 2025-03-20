document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    await loadClients();

    // Setup event listeners for adding clients
    document.getElementById('new-client-btn').addEventListener('click', () => {
        // Reset form when opening the modal to add new client
        document.getElementById('client-form').reset();
        document.getElementById('client-id').value = '';
        // Update modal title
        document.getElementById('clientModalLabel').textContent = 'Thêm Khách hàng';
        // Show the modal
        $('#clientModal').modal('show');
    });

    document.getElementById('save-client').addEventListener('click', saveClient);

    // Setup event listener for updating clients
    document.getElementById('update-client').addEventListener('click', updateClient);
});

let clientsTable;

async function loadClients() {
    try {
        const result = await apiRequest('/api/clients');

        if (!result.success) {
            console.error('Failed to load clients:', result.message);
            return;
        }

        // Clear table before reloading
        const clientsList = document.getElementById('clients-list');
        clientsList.innerHTML = '';

        // Destroy existing DataTable if it exists
        if (clientsTable && $.fn.DataTable.isDataTable('#clientsTable')) {
            clientsTable.destroy();
        }

        const clients = result.data;

        clients.forEach(client => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = client.name;

            const emailCell = document.createElement('td');
            emailCell.textContent = client.email || '-';

            const phoneCell = document.createElement('td');
            phoneCell.textContent = client.phone || '-';

            const companyCell = document.createElement('td');
            companyCell.textContent = client.company || '-';

            const actionsCell = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary me-2';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.addEventListener('click', () => editClient(client));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => deleteClient(client.id, client.name));

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(phoneCell);
            row.appendChild(companyCell);
            row.appendChild(actionsCell);

            clientsList.appendChild(row);
        });

        // Initialize DataTable
        clientsTable = $('#clientsTable').DataTable({
            order: [[0, 'asc']],
            responsive: true,
            language: {
                emptyTable: "No clients found"
            }
        });

    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function saveClient() {
    const clientId = document.getElementById('client-id').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const company = document.getElementById('company').value.trim();

    if (!name) {
        alert('Tên khách hàng là bắt buộc');
        return;
    }

    try {
        const clientData = { name, email, phone, address, company };
        console.log('Đang gửi dữ liệu khách hàng:', clientData);

        let result;
        if (clientId) {
            // Update existing client
            result = await apiRequest(`/api/clients/${clientId}`, 'PUT', clientData);
        } else {
            // Create new client
            result = await apiRequest('/api/clients', 'POST', clientData);
        }

        console.log('Phản hồi từ server:', result);

        if (result.success) {
            // Close modal and reset form
            $('#clientModal').modal('hide');
            document.getElementById('client-form').reset();

            // Reload clients
            await loadClients();

            // Show success message
            alert(clientId ? 'Đã cập nhật khách hàng thành công!' : 'Đã thêm khách hàng thành công!');
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể lưu khách hàng'));
        }
    } catch (error) {
        console.error('Lỗi lưu khách hàng:', error);
        alert('Đã xảy ra lỗi khi lưu thông tin khách hàng');
    }
}

function editClient(client) {
    // Populate the form with client data
    document.getElementById('client-id').value = client.id;
    document.getElementById('name').value = client.name;
    document.getElementById('email').value = client.email || '';
    document.getElementById('phone').value = client.phone || '';
    document.getElementById('address').value = client.address || '';
    document.getElementById('company').value = client.company || '';

    // Update modal title
    document.getElementById('clientModalLabel').textContent = 'Chỉnh sửa Khách hàng';

    // Show the modal
    $('#clientModal').modal('show');
}

async function deleteClient(clientId, name) {
    // First check if client has invoices
    try {
        const result = await apiRequest(`/api/clients/${clientId}`);

        if (!result.success) {
            alert('Lỗi: ' + (result.message || 'Không thể tải thông tin khách hàng.'));
            return;
        }

        // Get invoices for this client
        const invoicesResult = await apiRequest(`/api/invoices?clientId=${clientId}`);
        const hasInvoices = invoicesResult.success && invoicesResult.data && invoicesResult.data.length > 0;

        let confirmMessage = `Bạn có chắc chắn muốn xóa khách hàng "${name}"?`;
        let cascade = false;

        if (hasInvoices) {
            const invoiceCount = invoicesResult.data.length;
            const confirmCascade = confirm(
                `Khách hàng "${name}" có ${invoiceCount} hóa đơn liên quan. ` +
                `Bạn không thể xóa khách hàng mà không xóa các hóa đơn này. ` +
                `\n\nBạn có muốn xóa khách hàng này VÀ tất cả hóa đơn liên quan không?`
            );

            if (!confirmCascade) {
                return; // User canceled deletion
            }

            cascade = true;
        } else {
            // Simple confirmation for clients with no invoices
            if (!confirm(confirmMessage)) {
                return;
            }
        }

        // Proceed with deletion
        const deleteUrl = cascade
            ? `/api/clients/${clientId}?cascade=true`
            : `/api/clients/${clientId}`;

        const deleteResult = await apiRequest(deleteUrl, 'DELETE');

        if (deleteResult.success) {
            alert('Đã xóa khách hàng thành công!');
            await loadClients();
        } else {
            alert('Lỗi: ' + (deleteResult.message || 'Không thể xóa khách hàng.'));
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        alert('Đã xảy ra lỗi khi xóa khách hàng.');
    }
}
