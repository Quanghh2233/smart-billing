document.addEventListener('DOMContentLoaded', () => {
    // Xử lý form tìm kiếm nhanh theo SĐT trong sidebar
    const quickPhoneSearchForm = document.getElementById('quick-phone-search');
    if (quickPhoneSearchForm) {
        quickPhoneSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phoneNumber = document.getElementById('sidebar-phone-search').value.trim();

            if (phoneNumber) {
                // Hiện modal và điền sẵn số điện thoại
                document.getElementById('modal-phone-number').value = phoneNumber;

                // Mở modal tìm kiếm
                const searchModal = new bootstrap.Modal(document.getElementById('phoneSearchModal'));
                searchModal.show();

                // Tự động tìm kiếm
                modalSearchBillsByPhone();
            } else {
                // Nếu không có số điện thoại, mở modal nhưng không tìm kiếm
                const searchModal = new bootstrap.Modal(document.getElementById('phoneSearchModal'));
                searchModal.show();
            }
        });
    }

    // Xử lý form tìm kiếm trong modal
    const modalPhoneSearchForm = document.getElementById('modal-phone-search-form');
    if (modalPhoneSearchForm) {
        modalPhoneSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            modalSearchBillsByPhone();
        });
    }
});

// Tìm kiếm hóa đơn theo SĐT trong modal
async function modalSearchBillsByPhone() {
    const phoneNumber = document.getElementById('modal-phone-number').value.trim();

    if (!phoneNumber) {
        alert('Vui lòng nhập số điện thoại để tìm kiếm');
        return;
    }

    try {
        // Hiển thị trạng thái đang tìm kiếm
        const searchButton = document.getElementById('modal-search-button');
        const originalButtonHtml = searchButton.innerHTML;
        searchButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang tìm kiếm...';
        searchButton.disabled = true;

        // Gọi API tìm kiếm
        const apiUrl = `/api/bills/phone/${encodeURIComponent(phoneNumber)}`;
        console.log(`API request URL: ${apiUrl}`);

        const result = await apiRequest(apiUrl);
        console.log('Search result:', result);

        // Khôi phục trạng thái nút tìm kiếm
        searchButton.innerHTML = originalButtonHtml;
        searchButton.disabled = false;

        if (!result || !result.success) {
            alert('Lỗi: ' + ((result && result.message) || 'Không thể tìm kiếm hóa đơn'));
            return;
        }

        // Hiển thị kết quả
        displayModalSearchResults(result.data, phoneNumber);

    } catch (error) {
        console.error('Lỗi tìm kiếm hóa đơn:', error);
        document.getElementById('modal-search-button').innerHTML = originalButtonHtml;
        document.getElementById('modal-search-button').disabled = false;
        alert('Đã xảy ra lỗi khi tìm kiếm hóa đơn');
    }
}

// Hiển thị kết quả tìm kiếm trong modal
function displayModalSearchResults(bills, phoneNumber) {
    // Cập nhật thông tin tìm kiếm
    document.getElementById('modal-result-count').textContent = bills.length;
    document.getElementById('modal-searched-phone').textContent = phoneNumber;
    document.getElementById('modal-search-results').style.display = 'block';

    // Xóa dữ liệu cũ
    const billsList = document.getElementById('modal-bills-list');
    billsList.innerHTML = '';

    // Hủy DataTable nếu đã tồn tại
    if (window.modalBillsTable && $.fn.DataTable.isDataTable('#modalBillsTable')) {
        window.modalBillsTable.destroy();
    }

    if (bills.length === 0) {
        // Hiển thị thông báo nếu không tìm thấy kết quả
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = 'text-center';
        cell.textContent = 'Không tìm thấy hóa đơn nào cho số điện thoại này';
        row.appendChild(cell);
        billsList.appendChild(row);
    } else {
        // Hiển thị các hóa đơn tìm thấy
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

            const totalCell = document.createElement('td');
            totalCell.textContent = formatCurrency(invoice.total_amount);

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

            // Chỉ hiển thị nút thanh toán nếu còn số dư
            if (invoice.balance > 0) {
                actionsCell.appendChild(payBtn);
            }

            row.appendChild(numberCell);
            row.appendChild(clientCell);
            row.appendChild(phoneCell);
            row.appendChild(issueDateCell);
            row.appendChild(totalCell);
            row.appendChild(statusCell);
            row.appendChild(actionsCell);

            billsList.appendChild(row);
        });
    }

    // Khởi tạo DataTable cho bảng kết quả
    $(document).ready(() => {
        window.modalBillsTable = $('#modalBillsTable').DataTable({
            order: [[3, 'desc']], // Sắp xếp theo ngày phát hành (giảm dần)
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

// Helper function to capitalize first letter of a string
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Nếu đang ở trang tìm kiếm phone và có tham số phone, tự động điền vào ô tìm kiếm
if (window.location.pathname === '/phone-search') {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneParam = urlParams.get('phone');

    if (phoneParam && document.getElementById('phone-number')) {
        document.getElementById('phone-number').value = phoneParam;
    }
}
