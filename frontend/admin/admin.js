class AdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.user = JSON.parse(localStorage.getItem('user')) || {};
        this.token = localStorage.getItem('token');
    }

    async init() {
        // Check authentication
        if (!this.token || !this.user.isAdmin) {
            window.location.href = '../login.html';
            return;
        }

        // Render sidebar and navbar
        sidebar.render();
        navbar.render();

        // Initialize with dashboard
        this.navigateTo('dashboard');

        // Store app instance globally for event handling
        window.app = this;
    }

    async navigateTo(page) {
        this.currentPage = page;
        sidebar.setActive(page);

        const pageMap = {
            'dashboard': { title: 'Dashboard', renderer: dashboardPage },
            'users': { title: 'User Management', renderer: usersPage },
            'qr-codes': { title: 'QR Code Management', renderer: qrCodesPage },
            'activity': { title: 'Activity Logs', renderer: activityPage }
        };

        const pageConfig = pageMap[page];
        if (!pageConfig) {
            showError('Page not found');
            return;
        }

        navbar.setPageTitle(pageConfig.title);

        try {
            await pageConfig.renderer.render();
        } catch (error) {
            showError('Failed to load page: ' + error.message);
            console.error(error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AdminApp();
    app.init();
});
