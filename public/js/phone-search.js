document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    // Setup event listeners
    document.getElementById('phone-search-form').addEventListener('submit', (event) => {
        event.preventDefault();
        searchBillsByPhone();
    });

    // Tự động tìm kiếm nếu có tham số phone
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');
    if (phoneParam) {
        document.getElementById('phone-number').value = phoneParam;
        searchBillsByPhone();
    }
});

let billsTable;

async function searchBillsByPhone() {
    const phoneNumber = document.getElementById('phone-number').value.trim();

    if (!phoneNumber) {
        alert('Vui lòng nhập số điện thoại để tìm kiếm');
        return;
    }

    try {
        // Show loading indicator
        const searchButton = document.getElementById('search-button');
        const originalButtonHtml = searchButton.innerHTML;
        searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang tìm kiếm...';
        searchButton.disabled = true;

        // Log search attempt
        console.log(`Searching for phone number: ${phoneNumber}`);

        // Make API request
        const apiUrl = `/api/bills/phone/${encodeURIComponent(phoneNumber)}`;
        console.log(`API request URL: ${apiUrl}`);

        const result = await apiRequest(apiUrl);
        console.log('Search result:', result);

        // Restore button state
        searchButton.innerHTML = originalButtonHtml;
        searchButton.disabled = false;

        if (!result || !result.success) {
            alert('Lỗi: ' + ((result && result.message) || 'Không thể tìm kiếm hóa đơn'));
            return;
        }

        // Display the results
        displaySearchResults(result.data, phoneNumber);

    } catch (error) {
        console.error('Lỗi tìm kiếm hóa đơn:', error);
        document.getElementById('search-button').innerHTML = originalButtonHtml;
        document.getElementById('search-button').disabled = false;
        alert('Đã xảy ra lỗi khi tìm kiếm hóa đơn');
    }
}

function displaySearchResults(bills, phoneNumber) {
    // Update the search status
    document.getElementById('result-count').textContent = bills.length;
    document.getElementById('searched-phone').textContent = phoneNumber;
    document.getElementById('search-results').style.display = 'block';

    // Clear table before reloading
    const billsList = document.getElementById('bills-list');
    billsList.innerHTML = '';

    // Destroy existing DataTable if it exists
    if (billsTable && $.fn.DataTable.isDataTable('#billsTable')) {
        billsTable.destroy();
    }

    if (bills.length === 0) {
        // If no results found, show a message
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 10;
        cell.className = 'text-center';
        cell.textContent = 'Không tìm thấy hóa đơn nào cho số điện thoại này';
        row.appendChild(cell);
        billsList.appendChild(row);
    } else {
        bills.forEach(invoice => {
            const row = document.createElement('tr');

            const numberCell = document.createElement('td');
            const numberLink = document.createElement('a');
            numberLink.href = `/invoices/${invoice.id}`;
            numberLink.textContent = invoice.number;
            numberCell.appendChild(numberLink);

            const clientCell = document.createElement('td');
            clientCell.textContent = invoice.client_name;

            const phoneCell = document.createElement('td');
            phoneCell.textContent = invoice.client_phone;

            const issueDateCell = document.createElement('td');
            issueDateCell.textContent = formatDate(invoice.issue_date);

            const dueDateCell = document.createElement('td');
            dueDateCell.textContent = formatDate(invoice.due_date);

            const totalCell = document.createElement('td');
            totalCell.textContent = formatCurrency(invoice.total_amount);

            const paidCell = document.createElement('td');
            paidCell.textContent = formatCurrency(invoice.paid_amount);

            const balanceCell = document.createElement('td');
            balanceCell.textContent = formatCurrency(invoice.balance);

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
            viewBtn.title = 'Xem chi tiết';

            const payBtn = document.createElement('a');
            payBtn.href = `/invoices/${invoice.id}`;
            payBtn.className = 'btn btn-sm btn-outline-success';
            payBtn.innerHTML = '<i class="fas fa-money-bill"></i>';
            payBtn.title = 'Thanh toán';

            actionsCell.appendChild(viewBtn);

            // Only show payment button if there's a balance
            if (invoice.balance > 0) {
                actionsCell.appendChild(payBtn);
            }

            row.appendChild(numberCell);
            row.appendChild(clientCell);
            row.appendChild(phoneCell);
            row.appendChild(issueDateCell);
            row.appendChild(dueDateCell);
            row.appendChild(totalCell);
            row.appendChild(paidCell);
            row.appendChild(balanceCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);

            billsList.appendChild(row);
        });
    }

    // Initialize DataTable
    $(document).ready(() => {
        billsTable = $('#billsTable').DataTable({
            order: [[3, 'desc']], // Sort by issue date desc
            responsive: true,
            language: {
                emptyTable: "Không tìm thấy hóa đơn nào",
                info: "Hiển thị _START_ đến _END_ của _TOTAL_ hóa đơn",
                search: "Tìm kiếm:",
                paginate: {
                    first: "Đầu",
                    last: "Cuối",
                    next: "Sau",
                    previous: "Trước"
                },
                lengthMenu: "Hiển thị _MENU_ hóa đơn"
            }
        });
    });
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'paid': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'overdue': return 'bg-danger';
        case 'partial': return 'bg-info';
        case 'draft': return 'bg-secondary';
        case 'cancelled': return 'bg-dark';
        default: return 'bg-secondary';
    }
}
