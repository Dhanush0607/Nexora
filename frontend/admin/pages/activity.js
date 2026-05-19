class ActivityPage {
    constructor() {
        this.table = null;
    }

    async render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">Activity Logs</h2>
                <button class="btn btn-primary" id="refreshBtn">Refresh</button>
            </div>

            <div id="tableContainer" style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>
        `;

        document.getElementById('refreshBtn').addEventListener('click', () => this.loadActivityLogs());

        await this.loadActivityLogs();
    }

    async loadActivityLogs() {
        try {
            showLoader();
            const response = await adminAPI.getActivityLogs(50);
            console.log('Activity Logs API Response:', response);
            
            const tableContainer = document.getElementById('tableContainer');
            const logs = response.data || response.logs || response || [];
            console.log('Activity logs data to display:', logs);

            this.table = new DataTable({
                data: logs,
                pageSize: 10,
                columns: [
                    { key: 'timestamp', label: 'Timestamp', width: '20%', render: (row) => this.formatDateTime(row.timestamp) },
                    { key: 'user.email', label: 'User', width: '25%', render: (row) => row.user?.email || 'Unknown' },
                    { key: 'action', label: 'Action', width: '20%' },
                    { key: 'scanCount', label: 'Count', width: '10%' },
                    { key: 'blockchainTxHash', label: 'Blockchain TX', width: '25%', render: (row) => this.renderTxHash(row) }
                ]
            });

            this.table.render(tableContainer);
            hideLoader();
        } catch (error) {
            hideLoader();
            showError('Failed to load activity logs: ' + error.message);
            document.getElementById('tableContainer').innerHTML = `<div class="empty-state"><p>Error loading activity logs</p></div>`;
        }
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    renderTxHash(row) {
        if (!row.blockchainTxHash) {
            return '-';
        }
        const hash = row.blockchainTxHash;
        const truncated = hash.substring(0, 10) + '...';
        return `<span title="${hash}" style="cursor: pointer; text-decoration: underline;" onclick="navigator.clipboard.writeText('${hash}'); alert('Copied!');">${truncated}</span>`;
    }
}

const activityPage = new ActivityPage();
