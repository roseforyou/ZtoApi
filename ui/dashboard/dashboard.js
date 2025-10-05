let allRequests = [];
let currentPage = 1;
const itemsPerPage = 10;
let requestsChart = null;

function updateStats() {
    fetch('/dashboard/stats')
        .then(response => response.json())
        .then(data => {
            // Animate the stat updates
            animateValue('total-requests', parseInt(document.getElementById('total-requests').textContent) || 0, data.totalRequests || 0, 1000);
            animateValue('successful-requests', parseInt(document.getElementById('successful-requests').textContent) || 0, data.successfulRequests || 0, 1000);
            animateValue('failed-requests', parseInt(document.getElementById('failed-requests').textContent) || 0, data.failedRequests || 0, 1000);
            
            const avgTime = ((data.averageResponseTime || 0) / 1000).toFixed(2);
            const avgTimeElement = document.getElementById('avg-response-time');
            avgTimeElement.textContent = avgTime + 's';
            avgTimeElement.style.animation = 'pulse 0.5s ease';
            setTimeout(() => avgTimeElement.style.animation = '', 500);
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            // Show error state
            document.getElementById('total-requests').textContent = '---';
            document.getElementById('successful-requests').textContent = '---';
            document.getElementById('failed-requests').textContent = '---';
            document.getElementById('avg-response-time').textContent = '---';
        });
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
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

    // Get CSS variables for theming
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#f1f5f9' : '#1e293b';
    const gridColor = isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';
    const gradientColor = isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(102, 126, 234, 0.2)';
    const borderColor = isDarkMode ? '#60a5fa' : '#667eea';

    requestsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Response Time (s)',
                data: responseTimes.map(time => time / 1000),
                borderColor: borderColor,
                backgroundColor: gradientColor,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Response Time (s)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: 'Response time trend for last 20 requests',
                    color: textColor,
                    font: {
                        size: 16,
                        weight: '600'
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: borderColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    updateRequests();

    // Set up auto-refresh
    setInterval(updateStats, 5000);
    setInterval(updateRequests, 5000);
    
    // Add theme change listener to update chart
    const observer = new MutationObserver(() => {
        if (allRequests.length > 0) {
            updateChart();
        }
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Add loading animation
    document.body.classList.add('loaded');
});

// Handle visibility change to pause updates when tab is not visible
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause updates when tab is hidden
        console.log('Dashboard paused - tab is hidden');
    } else {
        // Resume updates when tab is visible
        updateStats();
        updateRequests();
        console.log('Dashboard resumed - tab is visible');
    }
});