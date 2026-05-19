class Sidebar {
    constructor() {
        this.container = document.getElementById('sidebar');
        this.currentPage = 'dashboard';
        this.menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: this.getIcon('dashboard') },
            { id: 'users', label: 'Users', icon: this.getIcon('users') },
            { id: 'qr-codes', label: 'QR Codes', icon: this.getIcon('qr') },
            { id: 'activity', label: 'Activity Logs', icon: this.getIcon('activity') }
        ];
    }

    getIcon(type) {
        const icons = {
            dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>`,
            users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>`,
            qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <line x1="14" y1="14" x2="20" y2="20"></line>
                <line x1="20" y1="14" x2="14" y2="20"></line>
            </svg>`,
            activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
            </svg>`
        };
        return icons[type] || '';
    }

    render() {
        this.container.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-brand">Nexora <span>Admin</span></div>
            </div>
            <div class="sidebar-menu">
                ${this.menuItems.map(item => `
                    <div class="sidebar-item ${item.id === this.currentPage ? 'active' : ''}" 
                         data-page="${item.id}">
                        ${item.icon}
                        <span>${item.label}</span>
                    </div>
                `).join('')}
            </div>
        `;

        // Attach event listeners
        this.container.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.setActive(page);
                if (window.app) {
                    window.app.navigateTo(page);
                }
            });
        });
    }

    setActive(pageId) {
        this.currentPage = pageId;
        this.container.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
    }
}

const sidebar = new Sidebar();
