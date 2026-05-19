class AdminAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/admin';
    }

    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found. Please login again.');
        }

        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ── Dashboard ──
    async getDashboardStats() {
        return this.request('/stats', { method: 'GET' });
    }

    // ── Users ──
    async getAllUsers(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page,
            limit,
            ...(search && { search })
        });
        return this.request(`/users?${params}`, { method: 'GET' });
    }

    async getUserDetails(userId) {
        return this.request(`/users/${userId}`, { method: 'GET' });
    }

    async toggleUserStatus(userId) {
        return this.request(`/users/${userId}/toggle`, { method: 'PATCH' });
    }

    async deleteUser(userId) {
        return this.request(`/users/${userId}`, { method: 'DELETE' });
    }

    async makeAdmin(userId) {
        return this.request(`/users/${userId}/make-admin`, { method: 'PATCH' });
    }

    // ── QR Codes ──
    async getAllQRRecords(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page,
            limit,
            ...(search && { search })
        });
        return this.request(`/qr-records?${params}`, { method: 'GET' });
    }

    async expireQRCode(qrId) {
        return this.request(`/qr-records/${qrId}/expire`, { method: 'PATCH' });
    }

    // ── Activity Logs ──
    async getActivityLogs(limit = 50) {
        const params = new URLSearchParams({ limit });
        return this.request(`/activity?${params}`, { method: 'GET' });
    }
}

const adminAPI = new AdminAPI();

// Helper function to show loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Helper function to show error (toast notification)
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `
        <div class="toast-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="toast-icon">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Helper function to show success (toast notification)
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
        <div class="toast-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="toast-icon">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Confirmation dialog
function confirm(message) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('confirmDialog');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmYes = document.getElementById('confirmYes');
        const confirmNo = document.getElementById('confirmNo');

        confirmMessage.textContent = message;
        dialog.style.display = 'flex';

        const cleanup = () => {
            confirmYes.removeEventListener('click', onYes);
            confirmNo.removeEventListener('click', onNo);
        };

        const onYes = () => {
            dialog.style.display = 'none';
            cleanup();
            resolve(true);
        };

        const onNo = () => {
            dialog.style.display = 'none';
            cleanup();
            resolve(false);
        };

        confirmYes.addEventListener('click', onYes);
        confirmNo.addEventListener('click', onNo);
    });
}
