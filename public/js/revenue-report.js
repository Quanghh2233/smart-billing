document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    // Set default month to current month
    const today = new Date();
    const yearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('month-selector').value = yearMonth;

    // Load initial data
    await loadRevenueData();

    // Setup event listeners
    document.getElementById('month-selector').addEventListener('change', loadRevenueData);
    document.getElementById('export-report').addEventListener('click', exportReport);
});

async function loadRevenueData() {
    try {
        const selectedMonth = document.getElementById('month-selector').value;

        // Fetch invoice data
        const result = await apiRequest('/api/invoices');
        if (!result.success) {
            console.error('Failed to load invoices:', result.message);
            return;
        }

        const invoices = result.data;

        // Filter by selected month if specified
        let filteredInvoices = invoices;
        if (selectedMonth) {
            filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.issue_date);
                const invoiceYearMonth = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
                return invoiceYearMonth === selectedMonth;
            });
        }

        // Calculate statistics
        const totalRevenue = filteredInvoices.reduce((sum, invoice) => {
            if (invoice.status === 'paid') return sum + parseFloat(invoice.total_amount);
            return sum;
        }, 0);

        const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid').length;
        const totalInvoices = filteredInvoices.length;
        const avgInvoice = totalInvoices > 0 ? totalRevenue / paidInvoices : 0;
        const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

        // Update UI
        document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('paid-count').textContent = paidInvoices;
        document.getElementById('avg-invoice').textContent = formatCurrency(avgInvoice);
        document.getElementById('collection-rate').textContent = Math.round(collectionRate) + '%';

        // Generate chart data
        generateMonthlyRevenueChart(invoices);
        generateClientRevenueChart(invoices);
        generateRevenueBreakdown(invoices);

    } catch (error) {
        console.error('Error loading revenue data:', error);
    }
}

function generateMonthlyRevenueChart(invoices) {
    // Group invoices by month
    const monthlyData = {};

    invoices.forEach(invoice => {
        if (invoice.status !== 'paid') return;

        const date = new Date(invoice.issue_date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[month]) {
            monthlyData[month] = 0;
        }

        monthlyData[month] += parseFloat(invoice.total_amount);
    });

    // Sort months
    const sortedMonths = Object.keys(monthlyData).sort();

    // Prepare chart data
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    const data = sortedMonths.map(month => monthlyData[month]);

    // Create chart
    const ctx = document.getElementById('monthlyRevenueChart').getContext('2d');

    try {
        // Destroy existing chart if it exists - add proper check
        if (window.monthlyChart && typeof window.monthlyChart.destroy === 'function') {
            window.monthlyChart.destroy();
        }

        window.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: data,
                    backgroundColor: 'rgba(78, 115, 223, 0.2)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
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
            }
        });
    } catch (err) {
        console.error('Error creating monthly revenue chart:', err);
    }
}

function generateClientRevenueChart(invoices) {
    // Group paid invoices by client
    const clientData = {};

    invoices.forEach(invoice => {
        if (invoice.status !== 'paid') return;

        if (!clientData[invoice.client_name]) {
            clientData[invoice.client_name] = 0;
        }

        clientData[invoice.client_name] += parseFloat(invoice.total_amount);
    });

    // Sort clients by revenue (descending)
    const sortedClients = Object.keys(clientData).sort((a, b) => clientData[b] - clientData[a]);

    // Take top 5 clients and group others
    const top5Clients = sortedClients.slice(0, 5);
    const otherClients = sortedClients.slice(5);
    const otherRevenue = otherClients.reduce((sum, client) => sum + clientData[client], 0);

    // Prepare chart data
    const labels = [...top5Clients];
    const data = top5Clients.map(client => clientData[client]);

    // Add "Others" category if needed
    if (otherClients.length > 0) {
        labels.push('Others');
        data.push(otherRevenue);
    }

    // Create chart
    const ctx = document.getElementById('clientRevenueChart').getContext('2d');

    try {
        // Destroy existing chart if it exists - add proper check
        if (window.clientChart && typeof window.clientChart.destroy === 'function') {
            window.clientChart.destroy();
        }

        window.clientChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#4e73df',
                        '#1cc88a',
                        '#36b9cc',
                        '#f6c23e',
                        '#e74a3b',
                        '#858796'
                    ]
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const value = context.raw;
                                const total = context.chart.getDatasetMeta(0).total;
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error creating client revenue chart:', err);
    }
}

function generateRevenueBreakdown(invoices) {
    // Group invoices by month
    const monthlyBreakdown = {};

    invoices.forEach(invoice => {
        const date = new Date(invoice.issue_date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyBreakdown[month]) {
            monthlyBreakdown[month] = {
                revenue: 0,
                invoiceCount: 0,
                paidCount: 0,
                overdueCount: 0
            };
        }

        monthlyBreakdown[month].invoiceCount++;

        if (invoice.status === 'paid') {
            monthlyBreakdown[month].revenue += parseFloat(invoice.total_amount);
            monthlyBreakdown[month].paidCount++;
        } else if (invoice.status === 'overdue') {
            monthlyBreakdown[month].overdueCount++;
        }
    });

    // Sort months in descending order (most recent first)
    const sortedMonths = Object.keys(monthlyBreakdown).sort().reverse();

    // Generate table rows
    const tableBody = document.getElementById('revenue-breakdown');
    tableBody.innerHTML = '';

    sortedMonths.forEach(month => {
        const data = monthlyBreakdown[month];
        const avgInvoice = data.paidCount > 0 ? data.revenue / data.paidCount : 0;

        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        const row = document.createElement('tr');

        const monthCell = document.createElement('td');
        monthCell.textContent = monthName;

        const revenueCell = document.createElement('td');
        revenueCell.textContent = formatCurrency(data.revenue);

        const invoiceCountCell = document.createElement('td');
        invoiceCountCell.textContent = data.invoiceCount;

        const avgInvoiceCell = document.createElement('td');
        avgInvoiceCell.textContent = formatCurrency(avgInvoice);

        const paidCountCell = document.createElement('td');
        paidCountCell.textContent = data.paidCount;

        const overdueCountCell = document.createElement('td');
        overdueCountCell.textContent = data.overdueCount;

        row.appendChild(monthCell);
        row.appendChild(revenueCell);
        row.appendChild(invoiceCountCell);
        row.appendChild(avgInvoiceCell);
        row.appendChild(paidCountCell);
        row.appendChild(overdueCountCell);

        tableBody.appendChild(row);
    });
}

function exportReport() {
    try {
        const selectedMonth = document.getElementById('month-selector').value;
        let filename = 'revenue-report';

        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = date.toLocaleString('default', { month: 'long' });
            filename += `-${monthName}-${year}`;
        } else {
            filename += `-all-time`;
        }

        // Get table data
        const table = document.getElementById('revenueTable');
        const rows = table.querySelectorAll('tr');

        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add headers
        const headers = [];
        rows[0].querySelectorAll('th').forEach(th => {
            headers.push(th.textContent);
        });
        csvContent += headers.join(',') + "\r\n";

        // Add data rows
        const tbody = table.querySelector('tbody');
        tbody.querySelectorAll('tr').forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                // Quote the cell content to handle commas
                rowData.push(`"${cell.textContent}"`);
            });
            csvContent += rowData.join(',') + "\r\n";
        });

        // Add summary data
        csvContent += "\r\n";
        csvContent += `"Total Revenue","${document.getElementById('total-revenue').textContent}"\r\n`;
        csvContent += `"Paid Invoices","${document.getElementById('paid-count').textContent}"\r\n`;
        csvContent += `"Average Invoice","${document.getElementById('avg-invoice').textContent}"\r\n`;
        csvContent += `"Collection Rate","${document.getElementById('collection-rate').textContent}"\r\n`;

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);

        // Download file
        link.click();

        // Clean up
        document.body.removeChild(link);

    } catch (error) {
        console.error('Error exporting report:', error);
        alert('An error occurred while exporting the report');
    }
}
