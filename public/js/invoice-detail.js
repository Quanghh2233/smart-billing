let currentInvoice = null;

document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    // Get invoice ID from URL
    const invoiceId = window.location.pathname.split('/').pop();

    await loadInvoiceDetails(invoiceId);

    // Set current date for payment
    const today = new Date();
    document.getElementById('payment-date').value = formatDateForInput(today);

    // Setup event listeners
    document.getElementById('print-invoice').addEventListener('click', printInvoice);
    document.getElementById('send-invoice').addEventListener('click', sendInvoice);
    document.getElementById('save-payment').addEventListener('click', recordPayment);
});

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadInvoiceDetails(invoiceId) {
    try {
        const result = await apiRequest(`/api/invoices/${invoiceId}`);

        if (!result.success) {
            console.error('Failed to load invoice:', result.message);
            return;
        }

        currentInvoice = result.data;

        // Set page title
        document.title = `Invoice ${currentInvoice.number} - Smart Billing System`;

        // Populate invoice header
        document.getElementById('invoice-number').textContent = currentInvoice.number;
        document.getElementById('invoice-number-display').textContent = currentInvoice.number;
        document.getElementById('issue-date').textContent = formatDate(currentInvoice.issue_date);
        document.getElementById('due-date').textContent = formatDate(currentInvoice.due_date);

        // Client info
        document.getElementById('client-name').textContent = currentInvoice.client_name;
        document.getElementById('client-email').textContent = currentInvoice.client_email || '';
        document.getElementById('client-phone').textContent = currentInvoice.client_phone || '';
        document.getElementById('client-address').textContent = currentInvoice.client_address || '';

        // Status badge
        const statusBadge = document.getElementById('status-badge');
        statusBadge.className = `badge ${getStatusBadgeClass(currentInvoice.status)}`;
        statusBadge.textContent = currentInvoice.status.charAt(0).toUpperCase() + currentInvoice.status.slice(1);

        // Invoice items
        const itemsContainer = document.getElementById('invoice-items');
        itemsContainer.innerHTML = '';

        currentInvoice.items.forEach(item => {
            const row = document.createElement('tr');

            const descCell = document.createElement('td');
            descCell.textContent = item.description;

            const qtyCell = document.createElement('td');
            qtyCell.className = 'text-end';
            qtyCell.textContent = item.quantity;

            const priceCell = document.createElement('td');
            priceCell.className = 'text-end';
            priceCell.textContent = formatCurrency(item.price);

            const amountCell = document.createElement('td');
            amountCell.className = 'text-end';
            amountCell.textContent = formatCurrency(item.amount);

            row.appendChild(descCell);
            row.appendChild(qtyCell);
            row.appendChild(priceCell);
            row.appendChild(amountCell);

            itemsContainer.appendChild(row);
        });

        // Totals
        document.getElementById('total-amount').textContent = formatCurrency(currentInvoice.total_amount);
        document.getElementById('paid-amount').textContent = formatCurrency(currentInvoice.totalPaid);
        document.getElementById('balance-amount').textContent = formatCurrency(currentInvoice.balance);

        // Notes
        document.getElementById('notes').textContent = currentInvoice.notes || 'No notes provided';

        // If there are payments, show the payment history section
        if (currentInvoice.payments && currentInvoice.payments.length > 0) {
            const paymentHistoryContainer = document.getElementById('payment-history');
            paymentHistoryContainer.innerHTML = '';

            currentInvoice.payments.forEach(payment => {
                const row = document.createElement('tr');

                const dateCell = document.createElement('td');
                dateCell.textContent = formatDate(payment.payment_date);

                const amountCell = document.createElement('td');
                amountCell.textContent = formatCurrency(payment.amount);

                const methodCell = document.createElement('td');
                methodCell.textContent = formatPaymentMethod(payment.payment_method);

                const refCell = document.createElement('td');
                refCell.textContent = payment.reference || '-';

                row.appendChild(dateCell);
                row.appendChild(amountCell);
                row.appendChild(methodCell);
                row.appendChild(refCell);

                paymentHistoryContainer.appendChild(row);
            });

            document.getElementById('payments-section').style.display = 'block';
        }

        // Set default payment amount to balance due
        document.getElementById('payment-amount').value = currentInvoice.balance;

        // If invoice is fully paid, disable payment button
        const recordPaymentBtn = document.getElementById('record-payment');
        if (currentInvoice.balance <= 0) {
            recordPaymentBtn.disabled = true;
            recordPaymentBtn.title = 'Invoice is fully paid';
        } else {
            recordPaymentBtn.disabled = false;
            recordPaymentBtn.title = '';
        }

    } catch (error) {
        console.error('Error loading invoice details:', error);
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

function printInvoice() {
    window.print();
}

function sendInvoice() {
    alert('Email functionality will be implemented in a future update.');
    // In a real app, this would open an email form or send directly via API
}

async function recordPayment() {
    if (!currentInvoice) return;

    const amount = parseFloat(document.getElementById('payment-amount').value);
    const paymentDate = document.getElementById('payment-date').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const reference = document.getElementById('payment-reference').value;
    const notes = document.getElementById('payment-notes').value;

    if (!amount || amount <= 0) {
        alert('Please enter a valid payment amount.');
        return;
    }

    if (amount > currentInvoice.balance) {
        alert('Payment amount cannot exceed the balance due.');
        return;
    }

    if (!paymentDate) {
        alert('Please enter the payment date.');
        return;
    }

    if (!paymentMethod) {
        alert('Please select a payment method.');
        return;
    }

    const paymentData = {
        invoice_id: currentInvoice.id,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference,
        notes
    };

    try {
        const result = await apiRequest('/api/payments', 'POST', paymentData);

        if (result.success) {
            $('#paymentModal').modal('hide');
            document.getElementById('payment-form').reset();

            // Reload invoice details to update payment history and totals
            await loadInvoiceDetails(currentInvoice.id);

            alert('Payment recorded successfully!');
        } else {
            alert('Error: ' + (result.message || 'Failed to record payment.'));
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        alert('An error occurred while recording the payment.');
    }
}
