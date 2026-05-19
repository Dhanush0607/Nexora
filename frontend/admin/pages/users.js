class UsersPage {
    constructor() {
        this.table = null;
        this.currentPage = 1;
        this.searchTerm = '';
    }

    async render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">User Management</h2>
                <button class="btn btn-primary" id="refreshBtn">Refresh</button>
            </div>

            <div class="search-box">
                <input type="text" class="search-input" id="searchInput" placeholder="Search by name, email, or ID...">
            </div>

            <div id="tableContainer" style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>
        `;

        document.getElementById('refreshBtn').addEventListener('click', () => this.loadUsers());
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.currentPage = 1;
            this.loadUsers();
        });

        await this.loadUsers();
    }

    async loadUsers() {
        try {
            showLoader();
            const response = await adminAPI.getAllUsers(this.currentPage, 10, this.searchTerm);
            console.log('Users API Response:', response);
            
            const tableContainer = document.getElementById('tableContainer');
            const users = response.data || response.users || response || [];
            
            console.log('Users data to display:', users);

            this.table = new DataTable({
                data: users,
                pageSize: 10,
                columns: [
                    { key: 'fullName', label: 'Name', width: '20%' },
                    { key: 'email', label: 'Email', width: '25%' },
                    { key: 'isActive', label: 'Status', width: '12%', render: (row) => this.renderStatus(row) },
                    { key: 'isAdmin', label: 'Role', width: '12%', render: (row) => this.renderRole(row) },
                    { key: 'createdAt', label: 'Joined', width: '18%', render: (row) => this.formatDate(row.createdAt) },
                    { key: '_id', label: 'Actions', width: '13%', sortDisabled: true, render: (row) => this.renderActions(row) }
                ],
                bulkActions: [
                    { key: 'deactivate', label: 'Deactivate', style: 'warning' },
                    { key: 'delete', label: 'Delete', style: 'danger' }
                ],
                onRowAction: (action, rowId) => this.handleRowAction(action, rowId),
                onBulkAction: (action, rows) => this.handleBulkAction(action, rows)
            });

            this.table.render(tableContainer);
            hideLoader();
        } catch (error) {
            hideLoader();
            showError('Failed to load users: ' + error.message);
            document.getElementById('tableContainer').innerHTML = `<div class="empty-state"><p>Error loading users</p></div>`;
        }
    }

    renderStatus(row) {
        const statusClass = row.isActive ? 'status-active' : 'status-inactive';
        const statusText = row.isActive ? 'Active' : 'Inactive';
        return `<span class="status-badge ${statusClass}">${statusText}</span>`;
    }

    renderRole(row) {
        if (row.isAdmin) {
            return `<span class="status-badge status-admin">Admin</span>`;
        }
        return `<span class="status-badge" style="background: rgba(123, 123, 143, 0.15); color: var(--text-muted);">User</span>`;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    renderActions(row) {
        return `
            <div class="actions-cell">
                <button class="action-btn" data-row-action="view" data-row-id="${row._id}" title="View Details">View</button>
                <button class="action-btn" data-row-action="toggle" data-row-id="${row._id}" title="Toggle Status">
                    ${row.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button class="action-btn ${row.isAdmin ? '' : ''}" data-row-action="admin" data-row-id="${row._id}" title="Make Admin">
                    ${row.isAdmin ? 'Is Admin' : 'Make Admin'}
                </button>
                <button class="action-btn danger" data-row-action="delete" data-row-id="${row._id}" title="Delete User">Delete</button>
            </div>
        `;
    }

    async handleRowAction(action, rowId) {
        try {
            if (action === 'view') {
                const response = await adminAPI.getUserDetails(rowId);
                console.log('User details response:', response);
                
                const user = response.data || response.user || response;
                console.log('User object to display:', user);
                
                if (!user || !user.fullName) {
                    showError('Invalid user data received');
                    return;
                }
                this.showUserDetails(user);
            } else if (action === 'toggle') {
                if (await confirm('Toggle this user\'s status?')) {
                    await adminAPI.toggleUserStatus(rowId);
                    showSuccess('User status updated');
                    this.loadUsers();
                }
            } else if (action === 'admin') {
                if (await confirm('Make this user an admin?')) {
                    await adminAPI.makeAdmin(rowId);
                    showSuccess('User is now an admin');
                    this.loadUsers();
                }
            } else if (action === 'delete') {
                if (await confirm('Delete this user? This action cannot be undone.')) {
                    await adminAPI.deleteUser(rowId);
                    showSuccess('User deleted');
                    this.loadUsers();
                }
            }
        } catch (error) {
            showError('Action failed: ' + error.message);
        }
    }

    async handleBulkAction(action, rows) {
        try {
            if (action === 'deactivate') {
                if (await confirm(`Deactivate ${rows.length} users?`)) {
                    for (const row of rows) {
                        if (row.isActive) {
                            await adminAPI.toggleUserStatus(row._id);
                        }
                    }
                    showSuccess(`${rows.length} users deactivated`);
                    this.loadUsers();
                }
            } else if (action === 'delete') {
                if (await confirm(`Delete ${rows.length} users? This action cannot be undone.`)) {
                    for (const row of rows) {
                        await adminAPI.deleteUser(row._id);
                    }
                    showSuccess(`${rows.length} users deleted`);
                    this.loadUsers();
                }
            }
        } catch (error) {
            showError('Bulk action failed: ' + error.message);
        }
    }

    showUserDetails(user) {
        const modal = document.getElementById('detailsModal');
        const title = document.getElementById('detailsTitle');
        const body = document.getElementById('detailsBody');

        title.textContent = user.fullName || 'User Details';
        
        body.innerHTML = `
            <div class="details-row">
                <div class="details-label">Email</div>
                <div class="details-value">${user.email}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Status</div>
                <div class="details-value">${user.isActive ? '✓ Active' : '✗ Inactive'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Role</div>
                <div class="details-value">${user.isAdmin ? 'Admin' : 'User'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Auth Provider</div>
                <div class="details-value">${user.authProvider || 'Local'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Joined</div>
                <div class="details-value">${this.formatDate(user.createdAt)}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Last Login</div>
                <div class="details-value">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</div>
            </div>
        `;
        
        modal.style.display = 'flex';
    }
}

const usersPage = new UsersPage();
