document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    // Initialize date pickers
    flatpickr('.datepicker', {
        dateFormat: 'Y-m-d',
        defaultDate: 'today'
    });

    // Set default dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30); // Default due date: 30 days from today

    document.getElementById('issue_date').value = formatDateForInput(today);
    document.getElementById('due_date').value = formatDateForInput(dueDate);

    // Generate invoice number
    generateInvoiceNumber();

    // Load clients
    await loadClients();

    // Setup event listeners
    document.getElementById('client_id').addEventListener('change', showClientDetails);
    document.getElementById('add-item').addEventListener('click', addInvoiceItem);
    document.getElementById('invoice-form').addEventListener('submit', createInvoice);
    document.getElementById('save-draft').addEventListener('click', saveDraft);

    // Setup initial item row events
    setupItemRowEvents();
});

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function loadClients() {
    try {
        const result = await apiRequest('/api/clients');
        if (!result.success) {
            console.error('Failed to load clients:', result.message);
            return;
        }

        const clients = result.data;
        const clientSelect = document.getElementById('client_id');

        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            option.dataset.email = client.email || '';
            option.dataset.phone = client.phone || '';
            option.dataset.address = client.address || '';
            clientSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function generateInvoiceNumber() {
    try {
        // Get latest invoice number from API or generate a default one
        const result = await apiRequest('/api/invoices');

        if (result.success && result.data.length > 0) {
            // Try to extract numeric part and increment
            const latestInvoice = result.data.sort((a, b) => {
                const numA = parseInt(a.number.replace(/\D/g, ''));
                const numB = parseInt(b.number.replace(/\D/g, ''));
                return numB - numA;
            })[0];

            const numMatch = latestInvoice.number.match(/(\d+)$/);
            if (numMatch) {
                const nextNum = parseInt(numMatch[1]) + 1;
                document.getElementById('number').value = `INV-${String(nextNum).padStart(5, '0')}`;
                return;
            }
        }

        // Fallback: generate a new invoice number based on timestamp
        const timestamp = new Date().getTime().toString().slice(-6);
        document.getElementById('number').value = `INV-${timestamp}`;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        // Fallback
        const timestamp = new Date().getTime().toString().slice(-6);
        document.getElementById('number').value = `INV-${timestamp}`;
    }
}

function showClientDetails() {
    const clientId = document.getElementById('client_id').value;

    if (!clientId) {
        document.getElementById('client-details').style.display = 'none';
        return;
    }

    const selectedOption = document.querySelector(`#client_id option[value="${clientId}"]`);

    document.getElementById('client-name').textContent = selectedOption.textContent;
    document.getElementById('client-email').textContent = selectedOption.dataset.email || 'No email provided';
    document.getElementById('client-phone').textContent = selectedOption.dataset.phone || 'No phone provided';
    document.getElementById('client-address').textContent = selectedOption.dataset.address || 'No address provided';

    document.getElementById('client-details').style.display = 'block';
}

function addInvoiceItem() {
    const itemsContainer = document.querySelector('#invoice-items tbody');
    const itemCount = itemsContainer.children.length + 1;

    const newRow = document.createElement('tr');
    newRow.id = `item-row-${itemCount}`;

    newRow.innerHTML = `
        <td><input type="text" class="form-control item-description" required></td>
        <td><input type="number" class="form-control item-quantity" min="1" value="1" required></td>
        <td><input type="number" class="form-control item-price" min="0" step="0.01" value="0.00" required></td>
        <td><input type="number" class="form-control item-amount" readonly value="0.00"></td>
        <td><button type="button" class="btn btn-sm btn-danger remove-item"><i class="fas fa-times"></i></button></td>
    `;

    itemsContainer.appendChild(newRow);
    setupItemRowEvents(newRow);
}

function setupItemRowEvents(row = null) {
    const rows = row ? [row] : document.querySelectorAll('#invoice-items tbody tr');

    rows.forEach(row => {
        const quantityInput = row.querySelector('.item-quantity');
        const priceInput = row.querySelector('.item-price');
        const amountInput = row.querySelector('.item-amount');
        const removeButton = row.querySelector('.remove-item');

        quantityInput.addEventListener('input', () => calculateItemAmount(row));
        priceInput.addEventListener('input', () => calculateItemAmount(row));

        removeButton.addEventListener('click', () => {
            // Don't remove if it's the only row
            const allRows = document.querySelectorAll('#invoice-items tbody tr');
            if (allRows.length > 1) {
                row.remove();
                calculateTotal();
            }
        });
    });
}

function calculateItemAmount(row) {
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const amount = quantity * price;

    row.querySelector('.item-amount').value = amount.toFixed(2);
    calculateTotal();
}

function calculateTotal() {
    const amountInputs = document.querySelectorAll('.item-amount');
    let total = 0;

    amountInputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    document.getElementById('total_amount').value = total.toFixed(2);
}

function getInvoiceData(status = 'pending') {
    const clientId = document.getElementById('client_id').value;
    const number = document.getElementById('number').value;
    const issueDate = document.getElementById('issue_date').value;
    const dueDate = document.getElementById('due_date').value;
    const totalAmount = parseFloat(document.getElementById('total_amount').value) || 0;
    const notes = document.getElementById('notes').value;

    const items = [];
    document.querySelectorAll('#invoice-items tbody tr').forEach(row => {
        const description = row.querySelector('.item-description').value;
        const quantity = parseFloat(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        const amount = parseFloat(row.querySelector('.item-amount').value);

        if (description && quantity && price) {
            items.push({
                description,
                quantity,
                price,
                amount
            });
        }
    });

    return {
        client_id: clientId,
        number,
        issue_date: issueDate,
        due_date: dueDate,
        total_amount: totalAmount,
        status,
        notes,
        items
    };
}

function validateInvoiceData(invoiceData) {
    if (!invoiceData.client_id) {
        alert('Please select a client.');
        return false;
    }

    if (!invoiceData.number) {
        alert('Please enter an invoice number.');
        return false;
    }

    if (!invoiceData.issue_date) {
        alert('Please enter an issue date.');
        return false;
    }

    if (!invoiceData.due_date) {
        alert('Please enter a due date.');
        return false;
    }

    if (invoiceData.items.length === 0) {
        alert('Please add at least one item.');
        return false;
    }

    return true;
}

async function createInvoice(event) {
    event.preventDefault();

    const invoiceData = getInvoiceData('pending');

    if (!validateInvoiceData(invoiceData)) {
        return;
    }

    try {
        const result = await apiRequest('/api/invoices', 'POST', invoiceData);

        if (result.success) {
            alert('Invoice created successfully!');
            window.location.href = `/invoices/${result.data.invoice_id}`;
        } else {
            alert('Error: ' + (result.message || 'Failed to create invoice.'));
        }
    } catch (error) {
        console.error('Error creating invoice:', error);
        alert('An error occurred while creating the invoice.');
    }
}

async function saveDraft() {
    const invoiceData = getInvoiceData('draft');

    if (!validateInvoiceData(invoiceData)) {
        return;
    }

    try {
        const result = await apiRequest('/api/invoices', 'POST', invoiceData);

        if (result.success) {
            alert('Draft saved successfully!');
            window.location.href = `/invoices/${result.data.invoice_id}`;
        } else {
            alert('Error: ' + (result.message || 'Failed to save draft.'));
        }
    } catch (error) {
        console.error('Error saving draft:', error);
        alert('An error occurred while saving the draft.');
    }
}
