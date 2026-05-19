class Navbar {
    constructor() {
        this.container = document.getElementById('navbar');
        this.user = JSON.parse(localStorage.getItem('user')) || {};
        this.pageTitle = 'Dashboard';
    }

    render() {
        const userInitial = this.user.fullName ? this.user.fullName.charAt(0).toUpperCase() : 'A';

        this.container.innerHTML = `
            <div class="navbar-left">
                <h1 class="navbar-title">${this.pageTitle}</h1>
            </div>
            <div class="navbar-right">
                <button class="navbar-btn" id="backBtn" style="display: none;">
                    <svg viewBox="0 0 24 24">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <span>Back to Dashboard</span>
                </button>
                <button class="navbar-btn" id="userMenuBtn">
                    <span>${this.user.fullName || 'Admin'}</span>
                    <div class="avatar">${userInitial}</div>
                </button>
                <button class="navbar-btn" id="logoutBtn">
                    <svg viewBox="0 0 24 24">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        `;

        const backBtn = document.getElementById('backBtn');
        backBtn.addEventListener('click', () => {
            if (window.app) {
                window.app.navigateTo('dashboard');
            }
        });

        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    }

    setPageTitle(title) {
        this.pageTitle = title;
        const titleEl = this.container.querySelector('.navbar-title');
        const backBtn = this.container.querySelector('#backBtn');
        
        if (titleEl) {
            titleEl.textContent = title;
        }
        
        // Show back button only when not on dashboard
        if (backBtn && title !== 'Dashboard') {
            backBtn.style.display = 'flex';
        } else if (backBtn) {
            backBtn.style.display = 'none';
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../login.html';
    }
}

const navbar = new Navbar();
