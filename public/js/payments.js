document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    await loadPayments();

    // Setup event listeners
    document.getElementById('confirm-delete').addEventListener('click', deletePayment);
});

async function loadPayments() {
    try {
        const result = await apiRequest('/api/payments');

        if (!result.success) {
            console.error('Failed to load payments:', result.message);
            return;
        }

        const payments = result.data;
        const paymentsList = document.getElementById('payments-list');
        paymentsList.innerHTML = '';

        payments.forEach(payment => {
            const row = document.createElement('tr');

            const dateCell = document.createElement('td');
            dateCell.textContent = formatDate(payment.payment_date);

            const invoiceCell = document.createElement('td');
            const invoiceLink = document.createElement('a');
            invoiceLink.href = `/invoices/${payment.invoice_id}`;
            invoiceLink.textContent = payment.invoice_number;
            invoiceCell.appendChild(invoiceLink);

            const clientCell = document.createElement('td');
            clientCell.textContent = payment.client_name;

            const methodCell = document.createElement('td');
            methodCell.textContent = formatPaymentMethod(payment.payment_method);

            const amountCell = document.createElement('td');
            amountCell.textContent = formatCurrency(payment.amount);

            const referenceCell = document.createElement('td');
            referenceCell.textContent = payment.reference || '-';

            const actionsCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.addEventListener('click', () => showDeleteModal(payment.id));
            actionsCell.appendChild(deleteBtn);

            row.appendChild(dateCell);
            row.appendChild(invoiceCell);
            row.appendChild(clientCell);
            row.appendChild(methodCell);
            row.appendChild(amountCell);
            row.appendChild(referenceCell);
            row.appendChild(actionsCell);

            paymentsList.appendChild(row);
        });

        // Initialize DataTable
        $('#paymentsTable').DataTable({
            order: [[0, 'desc']], // Sort by date desc
            responsive: true
        });

    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Cash',
        'bank_transfer': 'Bank Transfer',
        'credit_card': 'Credit Card',
        'check': 'Check',
        'other': 'Other'
    };

    return methods[method] || method;
}

function showDeleteModal(paymentId) {
    document.getElementById('delete-payment-id').value = paymentId;
    $('#deletePaymentModal').modal('show');
}

async function deletePayment() {
    const paymentId = document.getElementById('delete-payment-id').value;

    try {
        const result = await apiRequest(`/api/payments/${paymentId}`, 'DELETE');

        if (result.success) {
            $('#deletePaymentModal').modal('hide');

            // Destroy and reinitialize DataTable to refresh data
            if ($.fn.DataTable.isDataTable('#paymentsTable')) {
                $('#paymentsTable').DataTable().destroy();
            }

            await loadPayments();
        } else {
            alert('Error: ' + (result.message || 'Failed to delete payment.'));
        }
    } catch (error) {
        console.error('Error deleting payment:', error);
        alert('An error occurred while deleting the payment.');
    }
}
