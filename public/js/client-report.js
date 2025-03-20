document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    // Load clients for selector
    await loadClients();

    // Load initial data
    await loadClientReportData();

    // Setup event listeners
    document.getElementById('client-selector').addEventListener('change', loadClientReportData);
    document.getElementById('export-report').addEventListener('click', exportReport);
});

async function loadClients() {
    try {
        const result = await apiRequest('/api/clients');
        if (!result.success) {
            console.error('Failed to load clients:', result.message);
            return;
        }

        const clients = result.data;
        const selector = document.getElementById('client-selector');

        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function loadClientReportData() {
    try {
        const selectedClientId = document.getElementById('client-selector').value;

        // Fetch all invoices
        const invoicesResult = await apiRequest('/api/invoices');
        if (!invoicesResult.success) {
            console.error('Failed to load invoices:', invoicesResult.message);
            return;
        }

        let invoices = invoicesResult.data;

        // Fetch all clients if not already loaded
        const clientsResult = await apiRequest('/api/clients');
        if (!clientsResult.success) {
            console.error('Failed to load clients:', clientsResult.message);
            return;
        }

        const clients = clientsResult.data;

        // Filter by selected client if specified
        if (selectedClientId) {
            invoices = invoices.filter(invoice => invoice.client_id == selectedClientId);
        }

        // Calculate statistics
        const totalClients = clients.length;
        const clientsWithInvoices = new Set(invoices.map(inv => inv.client_id)).size;

        const totalRevenue = invoices.reduce((sum, invoice) => {
            if (invoice.status === 'paid') {
                return sum + parseFloat(invoice.total_amount);
            }
            return sum;
        }, 0);

        const avgRevenuePerClient = clientsWithInvoices > 0 ? totalRevenue / clientsWithInvoices : 0;

        const outstandingBalance = invoices.reduce((sum, invoice) => {
            if (invoice.status === 'pending' || invoice.status === 'overdue') {
                return sum + parseFloat(invoice.total_amount);
            }
            return sum;
        }, 0);

        // Update UI
        document.getElementById('total-clients').textContent = totalClients;
        document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
        document.getElementById('avg-revenue').textContent = formatCurrency(avgRevenuePerClient);
        document.getElementById('outstanding-balance').textContent = formatCurrency(outstandingBalance);

        // Generate chart data
        generateClientRevenueChart(invoices, clients);
        generatePaymentStatusChart(invoices);
        generateClientDetailsTable(invoices, clients);

    } catch (error) {
        console.error('Error loading client report data:', error);
    }
}

function generateClientRevenueChart(invoices, clients) {
    // Group paid invoices by client
    const clientData = {};

    clients.forEach(client => {
        clientData[client.id] = {
            name: client.name,
            revenue: 0
        };
    });

    invoices.forEach(invoice => {
        if (invoice.status === 'paid' && clientData[invoice.client_id]) {
            clientData[invoice.client_id].revenue += parseFloat(invoice.total_amount);
        }
    });

    // Convert to array and sort by revenue
    const sortedClients = Object.values(clientData)
        .filter(client => client.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue);

    // Take top 10 clients
    const topClients = sortedClients.slice(0, 10);

    // Prepare chart data
    const labels = topClients.map(client => client.name);
    const data = topClients.map(client => client.revenue);

    // Create chart
    const ctx = document.getElementById('clientRevenueChart').getContext('2d');

    try {
        // Destroy existing chart if it exists - add proper check
        if (window.clientRevenueChart && typeof window.clientRevenueChart.destroy === 'function') {
            window.clientRevenueChart.destroy();
        }

        // Create new chart
        window.clientRevenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue by Client',
                    data: data,
                    backgroundColor: 'rgba(78, 115, 223, 0.2)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                scales: {
                    x: {
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
        console.error('Error creating client revenue chart:', err);
    }
}

function generatePaymentStatusChart(invoices) {
    // Count invoices by status
    const statusCounts = {
        paid: 0,
        pending: 0,
        overdue: 0,
        draft: 0,
        cancelled: 0
    };

    invoices.forEach(invoice => {
        if (statusCounts.hasOwnProperty(invoice.status)) {
            statusCounts[invoice.status]++;
        }
    });

    // Prepare chart data
    const labels = Object.keys(statusCounts).map(status =>
        status.charAt(0).toUpperCase() + status.slice(1)
    );

    const data = Object.values(statusCounts);

    // Create chart
    const ctx = document.getElementById('paymentStatusChart').getContext('2d');

    try {
        // Destroy existing chart if it exists - add proper check
        if (window.paymentStatusChart && typeof window.paymentStatusChart.destroy === 'function') {
            window.paymentStatusChart.destroy();
        }

        window.paymentStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#1cc88a', // paid - green
                        '#f6c23e', // pending - yellow
                        '#e74a3b', // overdue - red
                        '#858796', // draft - gray
                        '#d1d3e2'  // cancelled - light gray
                    ]
                }]
            },
            options: {
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error creating payment status chart:', err);
    }
}

function generateClientDetailsTable(invoices, clients) {
    // Create a lookup map for client data
    const clientMap = {};
    clients.forEach(client => {
        clientMap[client.id] = {
            name: client.name,
            totalRevenue: 0,
            invoiceCount: 0,
            paidAmount: 0,
            paidCount: 0,
            outstandingAmount: 0,
            lastInvoiceDate: null
        };
    });

    // Process invoices to collect data for each client
    invoices.forEach(invoice => {
        const clientId = invoice.client_id;
        if (clientMap[clientId]) {
            const invoiceAmount = parseFloat(invoice.total_amount);
            const invoiceDate = new Date(invoice.issue_date);

            clientMap[clientId].invoiceCount++;

            // Update last invoice date if this invoice is newer
            if (!clientMap[clientId].lastInvoiceDate ||
                invoiceDate > clientMap[clientId].lastInvoiceDate) {
                clientMap[clientId].lastInvoiceDate = invoiceDate;
            }

            if (invoice.status === 'paid') {
                clientMap[clientId].paidAmount += invoiceAmount;
                clientMap[clientId].paidCount++;
                clientMap[clientId].totalRevenue += invoiceAmount;
            } else if (invoice.status === 'pending' || invoice.status === 'overdue') {
                clientMap[clientId].outstandingAmount += invoiceAmount;
            }
        }
    });

    // Convert to array and filter out clients with no invoices
    const clientDetails = Object.values(clientMap)
        .filter(client => client.invoiceCount > 0)
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Generate table rows
    const tableBody = document.getElementById('client-details');
    tableBody.innerHTML = '';

    clientDetails.forEach(client => {
        const row = document.createElement('tr');

        const nameCell = document.createElement('td');
        nameCell.textContent = client.name;

        const revenueCell = document.createElement('td');
        revenueCell.textContent = formatCurrency(client.totalRevenue);

        const invoiceCountCell = document.createElement('td');
        invoiceCountCell.textContent = client.invoiceCount;

        const avgInvoiceCell = document.createElement('td');
        const avgInvoice = client.paidCount > 0 ? client.paidAmount / client.paidCount : 0;
        avgInvoiceCell.textContent = formatCurrency(avgInvoice);

        const outstandingCell = document.createElement('td');
        outstandingCell.textContent = formatCurrency(client.outstandingAmount);

        const lastInvoiceCell = document.createElement('td');
        lastInvoiceCell.textContent = client.lastInvoiceDate ? formatDate(client.lastInvoiceDate) : 'N/A';

        row.appendChild(nameCell);
        row.appendChild(revenueCell);
        row.appendChild(invoiceCountCell);
        row.appendChild(avgInvoiceCell);
        row.appendChild(outstandingCell);
        row.appendChild(lastInvoiceCell);

        tableBody.appendChild(row);
    });

    // Initialize DataTable
    if ($.fn.DataTable.isDataTable('#clientTable')) {
        $('#clientTable').DataTable().destroy();
    }

    $('#clientTable').DataTable({
        order: [[1, 'desc']], // Sort by revenue desc
        responsive: true,
        language: {
            emptyTable: "No client data available"
        }
    });
}

function exportReport() {
    try {
        const selectedClientId = document.getElementById('client-selector').value;
        let filename = 'client-report';

        if (selectedClientId) {
            const clientSelect = document.getElementById('client-selector');
            const selectedOption = clientSelect.options[clientSelect.selectedIndex];
            const clientName = selectedOption.textContent.replace(/\s+/g, '-').toLowerCase();
            filename += `-${clientName}`;
        } else {
            filename += `-all-clients`;
        }

        // Get table data
        const table = document.getElementById('clientTable');
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
        csvContent += `"Total Clients","${document.getElementById('total-clients').textContent}"\r\n`;
        csvContent += `"Total Revenue","${document.getElementById('total-revenue').textContent}"\r\n`;
        csvContent += `"Average Revenue per Client","${document.getElementById('avg-revenue').textContent}"\r\n`;
        csvContent += `"Outstanding Balance","${document.getElementById('outstanding-balance').textContent}"\r\n`;

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
