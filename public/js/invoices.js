document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    await loadInvoices();

    // Setup event listeners
    document.getElementById('update-status').addEventListener('click', updateInvoiceStatus);
});

let invoicesTable;

async function loadInvoices() {
    try {
        const result = await apiRequest('/api/invoices');

        if (!result.success) {
            console.error('Failed to load invoices:', result.message);
            return;
        }

        // Clear table before reloading
        const invoicesList = document.getElementById('invoices-list');
        invoicesList.innerHTML = '';

        // Destroy existing DataTable if it exists
        if (invoicesTable && $.fn.DataTable.isDataTable('#invoicesTable')) {
            invoicesTable.destroy();
        }

        const invoices = result.data;

        invoices.forEach(invoice => {
            const row = document.createElement('tr');

            const numberCell = document.createElement('td');
            const numberLink = document.createElement('a');
            numberLink.href = `/invoices/${invoice.id}`;
            numberLink.textContent = invoice.number;
            numberCell.appendChild(numberLink);

            const clientCell = document.createElement('td');
            clientCell.textContent = invoice.client_name;

            const issueDateCell = document.createElement('td');
            issueDateCell.textContent = formatDate(invoice.issue_date);

            const dueDateCell = document.createElement('td');
            dueDateCell.textContent = formatDate(invoice.due_date);

            const amountCell = document.createElement('td');
            amountCell.textContent = formatCurrency(invoice.total_amount);

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge ${getStatusBadgeClass(invoice.status)}`;
            statusBadge.textContent = capitalizeFirstLetter(invoice.status);
            statusCell.appendChild(statusBadge);

            const actionsCell = document.createElement('td');

            const viewBtn = document.createElement('a');
            viewBtn.href = `/invoices/${invoice.id}`;
            viewBtn.className = 'btn btn-sm btn-outline-primary me-1';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';

            const statusBtn = document.createElement('button');
            statusBtn.className = 'btn btn-sm btn-outline-secondary me-1';
            statusBtn.innerHTML = '<i class="fas fa-edit"></i>';
            statusBtn.addEventListener('click', () => showStatusModal(invoice));

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => deleteInvoice(invoice.id));

            actionsCell.appendChild(viewBtn);
            actionsCell.appendChild(statusBtn);
            actionsCell.appendChild(deleteBtn);

            row.appendChild(numberCell);
            row.appendChild(clientCell);
            row.appendChild(issueDateCell);
            row.appendChild(dueDateCell);
            row.appendChild(amountCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);

            invoicesList.appendChild(row);
        });

        // Initialize DataTable
        invoicesTable = $('#invoicesTable').DataTable({
            order: [[2, 'desc']], // Sort by issue date desc
            responsive: true,
            language: {
                emptyTable: "No invoices found"
            }
        });

    } catch (error) {
        console.error('Error loading invoices:', error);
    }
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showStatusModal(invoice) {
    document.getElementById('invoice-id').value = invoice.id;
    document.getElementById('status').value = invoice.status;
    $('#statusModal').modal('show');
}

async function updateInvoiceStatus() {
    const invoiceId = document.getElementById('invoice-id').value;
    const status = document.getElementById('status').value;

    // Add loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    document.body.appendChild(loadingOverlay);

    try {
        // Close modal before the request to prevent multiple clicks
        $('#statusModal').modal('hide');

        const result = await apiRequest(`/api/invoices/${invoiceId}/status`, 'PATCH', { status });

        // Remove loading overlay
        document.body.removeChild(loadingOverlay);

        if (result.success) {
            // Success message
            alert('Cập nhật trạng thái hóa đơn thành công!');

            // Reload invoices with clean DataTable handling
            await loadInvoices();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể cập nhật trạng thái.'));

            // Reload anyway to ensure UI is consistent
            await loadInvoices();
        }
    } catch (error) {
        // Remove loading overlay on error
        if (document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
        }

        console.error('Error updating invoice status:', error);
        alert('Đã xảy ra lỗi khi cập nhật trạng thái.');

        // Reload anyway to ensure UI is consistent
        await loadInvoices();
    }
}

async function deleteInvoice(invoiceId) {
    if (!confirm('Bạn có chắc chắn muốn xóa hóa đơn này? Thao tác này sẽ xóa cả các hạng mục và thanh toán liên quan.')) {
        return;
    }

    // Add loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
    document.body.appendChild(loadingOverlay);

    try {
        const result = await apiRequest(`/api/invoices/${invoiceId}`, 'DELETE');

        // Remove loading overlay
        document.body.removeChild(loadingOverlay);

        if (result.success) {
            // Success message
            alert('Đã xóa hóa đơn thành công!');

            // Reload invoices with clean DataTable handling
            await loadInvoices();
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể xóa hóa đơn.'));

            // Reload anyway to ensure UI is consistent with database
            await loadInvoices();
        }
    } catch (error) {
        // Remove loading overlay on error
        if (document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
        }

        console.error('Error deleting invoice:', error);
        alert('Đã xảy ra lỗi khi xóa hóa đơn.');

        // Reload anyway to ensure UI is consistent
        await loadInvoices();
    }
}
