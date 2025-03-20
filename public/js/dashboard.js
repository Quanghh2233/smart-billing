document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    loadDashboardStats();
    loadRecentInvoices();
    initRevenueChart();
});

async function loadDashboardStats() {
    try {
        // Get invoices data for statistics
        const result = await apiRequest('/api/invoices');
        if (!result.success) {
            console.error('Failed to load invoices:', result.message);
            return;
        }

        const invoices = result.data;

        // Calculate total revenue (from paid invoices)
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);

        // Count invoices by status
        const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
        const paidCount = paidInvoices.length;
        const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

        // Update UI
        document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('paid-invoices').textContent = paidCount;
        document.getElementById('pending-invoices').textContent = pendingCount;
        document.getElementById('overdue-invoices').textContent = overdueCount;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentInvoices() {
    try {
        // Get recent invoices
        const result = await apiRequest('/api/invoices');
        if (!result.success) {
            console.error('Failed to load invoices:', result.message);
            return;
        }

        // Sort by created_at and take latest 5
        const recentInvoices = result.data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        const tableBody = document.querySelector('#recent-invoices tbody');
        tableBody.innerHTML = '';

        recentInvoices.forEach(invoice => {
            const row = document.createElement('tr');

            const clientCell = document.createElement('td');
            clientCell.textContent = invoice.client_name;

            const amountCell = document.createElement('td');
            amountCell.textContent = formatCurrency(invoice.total_amount);

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = `badge ${getStatusBadgeClass(invoice.status)}`;
            statusBadge.textContent = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
            statusCell.appendChild(statusBadge);

            row.appendChild(clientCell);
            row.appendChild(amountCell);
            row.appendChild(statusCell);

            // Add click event to navigate to invoice detail
            row.style.cursor = 'pointer';
            row.addEventListener('click', () => {
                window.location.href = `/invoices/${invoice.id}`;
            });

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading recent invoices:', error);
    }
}

function initRevenueChart() {
    // Get the canvas element
    const ctx = document.getElementById('revenueChart');

    // Generate last 6 months labels
    const labels = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        labels.push(month.toLocaleString('default', { month: 'short' }));
    }

    // Sample data - in a real app, this would be fetched from API
    const data = {
        labels: labels,
        datasets: [{
            label: 'Revenue',
            backgroundColor: 'rgba(78, 115, 223, 0.2)',
            borderColor: 'rgba(78, 115, 223, 1)',
            borderWidth: 1,
            data: [4250, 5500, 3800, 6000, 5100, 4800],
            fill: true
        }]
    };

    const options = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '$' + value;
                    }
                }
            }
        }
    };

    // Create and render the chart
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}
