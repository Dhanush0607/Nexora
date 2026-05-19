class QRCodesPage {
    constructor() {
        this.table = null;
        this.searchTerm = '';
    }

    async render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">QR Code Management</h2>
                <button class="btn btn-primary" id="refreshBtn">Refresh</button>
            </div>

            <div class="search-box">
                <input type="text" class="search-input" id="searchInput" placeholder="Search by user email or QR ID...">
            </div>

            <div id="tableContainer" style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>
        `;

        document.getElementById('refreshBtn').addEventListener('click', () => this.loadQRCodes());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.loadQRCodes();
        });

        await this.loadQRCodes();
    }

    async loadQRCodes() {
        try {
            showLoader();
            const response = await adminAPI.getAllQRRecords(1, 10, this.searchTerm);
            console.log('QR Codes API Response:', response);
            
            const tableContainer = document.getElementById('tableContainer');
            const qrCodes = response.data || response.records || response || [];
            console.log('QR codes data to display:', qrCodes);

            this.table = new DataTable({
                data: qrCodes,
                pageSize: 10,
                columns: [
                    { key: '_id', label: 'QR ID', width: '15%', render: (row) => this.truncateId(row._id) },
                    { key: 'user.email', label: 'User', width: '20%', render: (row) => row.user?.email || 'Unknown' },
                    { key: 'selectedUtilities', label: 'Utilities', width: '18%', render: (row) => this.renderUtilities(row) },
                    { key: 'scanCount', label: 'Scans', width: '10%' },
                    { key: 'isExpired', label: 'Status', width: '12%', render: (row) => this.renderStatus(row) },
                    { key: 'lastScannedAt', label: 'Last Scanned', width: '15%', render: (row) => this.formatDate(row.lastScannedAt) },
                    { key: '_id', label: 'Actions', width: '10%', sortDisabled: true, render: (row) => this.renderActions(row) }
                ],
                bulkActions: [
                    { key: 'expire', label: 'Expire', style: 'warning' }
                ],
                onRowAction: (action, rowId) => this.handleRowAction(action, rowId),
                onBulkAction: (action, rows) => this.handleBulkAction(action, rows)
            });

            this.table.render(tableContainer);
            hideLoader();
        } catch (error) {
            hideLoader();
            showError('Failed to load QR codes: ' + error.message);
            document.getElementById('tableContainer').innerHTML = `<div class="empty-state"><p>Error loading QR codes</p></div>`;
        }
    }

    truncateId(id) {
        return id.substring(0, 12) + '...';
    }

    renderUtilities(row) {
        if (!row.selectedUtilities || row.selectedUtilities.length === 0) {
            return '-';
        }
        return row.selectedUtilities.join(', ');
    }

    renderStatus(row) {
        const statusClass = row.isExpired ? 'status-inactive' : 'status-active';
        const statusText = row.isExpired ? 'Expired' : 'Active';
        return `<span class="status-badge ${statusClass}">${statusText}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    renderActions(row) {
        return `
            <div class="actions-cell">
                <button class="action-btn" data-row-action="view" data-row-id="${row._id}" title="View Details">View</button>
                ${!row.isExpired ? `<button class="action-btn warning" data-row-action="expire" data-row-id="${row._id}" title="Expire">Expire</button>` : ''}
            </div>
        `;
    }

    async handleRowAction(action, rowId) {
        try {
            if (action === 'view') {
                const response = await adminAPI.getAllQRRecords(1, 1000, '');
                const qr = response.data.find(q => q._id === rowId);
                if (qr) {
                    this.showQRDetails(qr);
                }
            } else if (action === 'expire') {
                if (await confirm('Expire this QR code?')) {
                    await adminAPI.expireQRCode(rowId);
                    showSuccess('QR code expired');
                    this.loadQRCodes();
                }
            }
        } catch (error) {
            showError('Action failed: ' + error.message);
        }
    }

    async handleBulkAction(action, rows) {
        try {
            if (action === 'expire') {
                if (await confirm(`Expire ${rows.length} QR codes?`)) {
                    for (const row of rows) {
                        if (!row.isExpired) {
                            await adminAPI.expireQRCode(row._id);
                        }
                    }
                    showSuccess(`${rows.length} QR codes expired`);
                    this.loadQRCodes();
                }
            }
        } catch (error) {
            showError('Bulk action failed: ' + error.message);
        }
    }

    showQRDetails(qr) {
        const modal = document.getElementById('detailsModal');
        const title = document.getElementById('detailsTitle');
        const body = document.getElementById('detailsBody');

        title.textContent = 'QR Code Details';
        
        body.innerHTML = `
            <div class="details-row">
                <div class="details-label">QR ID</div>
                <div class="details-value" style="font-family: monospace; font-size: 12px;">${qr._id}</div>
            </div>
            <div class="details-row">
                <div class="details-label">User</div>
                <div class="details-value">${qr.user?.email || 'Unknown'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Utilities</div>
                <div class="details-value">${qr.selectedUtilities?.join(', ') || 'None'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Scan Count</div>
                <div class="details-value">${qr.scanCount || 0}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Status</div>
                <div class="details-value">${qr.isExpired ? '✗ Expired' : '✓ Active'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Expires At</div>
                <div class="details-value">${this.formatDate(qr.expiresAt)}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Last Scanned</div>
                <div class="details-value">${qr.lastScannedAt ? this.formatDate(qr.lastScannedAt) : 'Never'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Blockchain TX</div>
                <div class="details-value" style="font-family: monospace; font-size: 12px;">${qr.blockchainTxHash || 'Pending'}</div>
            </div>
        `;
        
        modal.style.display = 'flex';
    }
}

const qrCodesPage = new QRCodesPage();
