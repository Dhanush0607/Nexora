class DashboardPage {
    async render() {
        const content = document.getElementById('content');
        content.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>';

        try {
            const response = await adminAPI.getDashboardStats();
            console.log('Dashboard stats response:', response);

            // Handle different response formats - backend returns 'stats' key
            const stats = response.stats || response.data || response;

            content.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">Dashboard</h2>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="stat-card">
                        <div class="stat-label">Total Users</div>
                        <div class="stat-value">${stats.totalUsers || 0}</div>
                        <div class="stat-sub">All registered users</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Active Users</div>
                        <div class="stat-value">${stats.activeUsers || 0}</div>
                        <div class="stat-sub positive">${stats.activePercentage || 0}% of total</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total QR Codes</div>
                        <div class="stat-value">${stats.totalQRCodes || 0}</div>
                        <div class="stat-sub">Active codes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Total Scans</div>
                        <div class="stat-value">${stats.totalScans || 0}</div>
                        <div class="stat-sub">All time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Active Sessions</div>
                        <div class="stat-value">${stats.activeSessions || 0}</div>
                        <div class="stat-sub">WebRTC connections</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">New Today</div>
                        <div class="stat-value">${stats.newRegistrationsToday || 0}</div>
                        <div class="stat-sub">New registrations</div>
                    </div>
                </div>

                <div class="section-header">
                    <h3 class="section-title" style="font-size: 18px; margin: 0;">Quick Actions</h3>
                </div>

                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="window.app.navigateTo('users')">Manage Users</button>
                    <button class="btn btn-primary" onclick="window.app.navigateTo('qr-codes')">Manage QR Codes</button>
                    <button class="btn btn-secondary" onclick="window.app.navigateTo('activity')">View Activity Logs</button>
                </div>
            `;
        } catch (error) {
            console.error('Dashboard error:', error);
            showError('Failed to load dashboard stats: ' + error.message);
            content.innerHTML = `
                <div class="error-banner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                        <strong>Error loading dashboard</strong>
                        <p style="margin-top: 0.5rem; font-size: 12px; opacity: 0.9;">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }
}

const dashboardPage = new DashboardPage();
