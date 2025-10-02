let allRequests = [];
let currentPage = 1;
const itemsPerPage = 10;
let requestsChart = null;

function updateStats() {
    fetch('/dashboard/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-requests').textContent = data.totalRequests || 0;
            document.getElementById('successful-requests').textContent = data.successfulRequests || 0;
            document.getElementById('failed-requests').textContent = data.failedRequests || 0;
            document.getElementById('avg-response-time').textContent = ((data.averageResponseTime || 0) / 1000).toFixed(2) + 's';
        })
        .catch(error => console.error('Error fetching stats:', error));
}

function updateRequests() {
    fetch('/dashboard/requests')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                console.error('Returned data is not an array:', data);
                return;
            }

            allRequests = data;

            allRequests.sort((a, b) => {
                const timeA = new Date(a.timestamp);
                const timeB = new Date(b.timestamp);
                return timeB - timeA;
            });

            updateTable();
            updateChart();
            updatePagination();
        })
        .catch(error => console.error('Error fetching requests:', error));
}

function updateTable() {
    const tbody = document.getElementById('requests-tbody');
    tbody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = allRequests.slice(startIndex, endIndex);

    currentRequests.forEach(request => {
        const row = document.createElement('tr');

        let timeStr = "Invalid Date";
        if (request.timestamp) {
            try {
                const time = new Date(request.timestamp);
                if (!isNaN(time.getTime())) {
                    timeStr = time.toLocaleTimeString();
                }
            } catch (e) {
                console.error("Time formatting error:", e);
            }
        }

        let modelName = "GLM-4.5";
        if (request.path && request.path.includes('glm-4.5v')) {
            modelName = "GLM-4.5V";
        } else if (request.model) {
            modelName = request.model;
        }

        const statusClass = request.status >= 200 && request.status < 300 ? 'status-success' : 'status-error';
        const status = request.status || "undefined";

        let userAgent = request.user_agent || "undefined";
        if (userAgent.length > 30) {
            userAgent = userAgent.substring(0, 30) + "...";
        }

        row.innerHTML = "<td>" + timeStr + "</td>" + "<td>" + modelName + "</td>" + "<td>" + (request.method || "undefined") + "</td>" + "<td class='" + statusClass + "'>" + status + "</td>" + "<td>" + ((request.duration / 1000).toFixed(2) || "undefined") + "s</td>" + "<td title='" + (request.user_agent || "") + "'>" + userAgent + "</td>";

        tbody.appendChild(row);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(allRequests.length / itemsPerPage);
    document.getElementById('page-info').textContent = "Page " + currentPage + " of " + totalPages;

    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

function updateChart() {
    const ctx = document.getElementById('requestsChart').getContext('2d');

    const chartData = allRequests.slice(0, 20).reverse();
    const labels = chartData.map(req => {
        const time = new Date(req.timestamp);
        return time.toLocaleTimeString();
    });
    const responseTimes = chartData.map(req => req.duration);

    if (requestsChart) {
        requestsChart.destroy();
    }

    requestsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Response Time (s)',
                data: responseTimes.map(time => time / 1000),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (s)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Response time trend for last 20 requests (s)'
                }
            }
        }
    });
}

document.getElementById('prev-page').addEventListener('click', function() {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
        updatePagination();
    }
});

document.getElementById('next-page').addEventListener('click', function() {
    const totalPages = Math.ceil(allRequests.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updateTable();
        updatePagination();
    }
});

updateStats();
updateRequests();

setInterval(updateStats, 5000);
setInterval(updateRequests, 5000);