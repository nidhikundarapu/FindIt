// ============================================================
// LOST & FOUND — Core App Engine  (FastAPI Migration)
// ============================================================

// ---- API Utility ----
const API = {
    token: localStorage.getItem('lf_token'),
    async request(path, options = {}) {
        const url = path.startsWith('http') ? path : `${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
            ...options.headers
        };
        try {
            const resp = await fetch(url, { ...options, headers });
            if (resp.status === 401 && State.currentUser) {
                State.logout();
                throw new Error('Session expired');
            }
            let data;
            try {
                data = await resp.json();
            } catch (parseErr) {
                throw new Error('Server not responding. Is the backend running on this port?');
            }
            if (!resp.ok) throw new Error(data.detail || 'API Error');
            return data;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    },
    get(path) { return this.request(path, { method: 'GET' }); },
    post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); },
    put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); },
    del(path) { return this.request(path, { method: 'DELETE' }); }
};

// ---- Helpers (early, used everywhere) ----
function genId(prefix) { return prefix + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(); }
function timeAgo(ms) {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}
function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function initials(name) { return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }
async function addLog(event, desc, severity = 'low') {
    try { await API.post('/api/admin/logs', { event, desc, severity }); } catch (e) {}
}
function toast(msg, type = 'info') {
    const c = document.getElementById('toast-container'); if (!c) return;
    const t = document.createElement('div'); t.className = `toast toast-${type}`; t.textContent = msg;
    c.appendChild(t); setTimeout(() => t.remove(), 3500);
}

// ---- State ----
const State = {
    currentUser: null, currentPage: 'login', routeParams: {},
    items: [], claims: [], logs: [],
    async init() {
        const token = localStorage.getItem('lf_token');
        if (token) {
            try {
                this.currentUser = await API.get('/api/auth/me');
                await this.refresh();
            } catch (e) {
                this.logout();
            }
        }
    },
    async refresh() {
        if (!this.currentUser) return;
        try {
            const [items, claims] = await Promise.all([
                API.get('/api/items'),
                API.get('/api/claims')
            ]);
            this.items = items;
            this.claims = claims;
            if (this.currentUser.role === 'admin' || this.currentUser.role === 'security') {
                const [logs, users] = await Promise.all([
                    API.get('/api/admin/logs'),
                    API.get('/api/admin/users')
                ]);
                this.logs = logs;
                this.users = users;
            } else {
                this.users = []; // Regular users don't see all users
            }
        } catch (e) {
            console.error('Refresh failed', e);
        }
    },
    login(token, user) {
        this.currentUser = user;
        API.token = token;
        localStorage.setItem('lf_token', token);
    },
    logout() {
        this.currentUser = null;
        API.token = null;
        localStorage.removeItem('lf_token');
        Router.go('login');
    }
};

// ---- Router ----
const Router = {
    async go(page, params = {}) {
        if (!State.currentUser && page !== 'login' && page !== 'register') page = 'login';
        State.currentPage = page; State.routeParams = params; 
        await this.render(); 
        window.scrollTo(0, 0);
    },
    async render() {
        const appEl = document.getElementById('app');
        const page = State.currentPage;
        const noAuth = ['login', 'register'];
        
        // Refresh data before rendering authenticated pages
        if (!noAuth.includes(page)) {
            await State.refresh();
        }

        const content = await Pages[page]?.() || '<p>Page not found</p>';
        
        if (noAuth.includes(page)) {
            appEl.innerHTML = content;
        } else {
            appEl.innerHTML = Shell.render(content);
        }
        Binders[page]?.();
    }
};

// ---- Category thumb class ----
function thumbClass(cat, isPrivate) {
    if (isPrivate) return 'thumb-private';
    const m = { 'Electronics': 'thumb-electronics', 'Accessories': 'thumb-accessories', 'Bags': 'thumb-bags', 'Keys': 'thumb-keys', 'Jewelry': 'thumb-jewelry', 'Documents': 'thumb-documents', 'Clothing': 'thumb-clothing' };
    return m[cat] || 'thumb-other';
}

// ---- SVG icons (inline) ----
const Icons = {
    search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
    logo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
    logout: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
};

// ---- Shell ----
const Shell = {
    render(content) {
        const u = State.currentUser;
        const isAdmin = u?.role === 'admin', isSecurity = u?.role === 'security';
        const notifCount = State.claims.filter(c => c.status === 'pending').length;
        const p = State.currentPage;
        return `
    <div id="toast-container"></div>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="sidebar-logo-mark">${Icons.logo}</div>
          <div>
            <div class="sidebar-logo-text">FindIt</div>
            <div class="sidebar-logo-sub">Lost &amp; Found</div>
          </div>
        </div>
        <span class="sidebar-section-label">Main</span>
        ${['dashboard', 'browse', 'report', 'my-reports'].map(pg => navItem(pg, p)).join('')}
        <span class="sidebar-section-label">Matching</span>
        ${navItemBadge('matches', p)}
        <button class="nav-item ${p === 'claims' ? 'active' : ''}" onclick="Router.go('claims')">
          <span class="nav-dot"></span>Claims
          ${notifCount ? `<span class="nav-badge">${notifCount}</span>` : ''}
        </button>
        ${isAdmin || isSecurity ? `
        <span class="sidebar-section-label">Admin</span>
        ${isAdmin ? navItem('admin', p) : ''}
        ${navItem('security', p)}` : ''}
        <span class="sidebar-section-label">Account</span>
        ${navItem('profile', p)}
        <div class="sidebar-footer">
          <div class="sidebar-user" onclick="Router.go('profile')">
            <div class="avatar">${initials(u?.name || '?')}</div>
            <div style="flex:1">
              <div class="sidebar-user-name">${escHtml(u?.name || '')}</div>
              <div class="sidebar-user-role">${u?.role || ''}</div>
            </div>
            <button onclick="event.stopPropagation();State.logout()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex;align-items:center" title="Sign out">${Icons.logout}</button>
          </div>
        </div>
      </aside>
      <main class="main-content fade-in">${content}</main>
    </div>`;
    }
};

const NAV_LABELS = {
    dashboard: 'Dashboard', browse: 'Browse Items', report: 'Report Item',
    'my-reports': 'My Reports', matches: 'Smart Matches', claims: 'Claims',
    admin: 'Admin Panel', security: 'Security', profile: 'Profile'
};

function navItem(pg, cur) {
    return `<button class="nav-item ${cur === pg ? 'active' : ''}" onclick="Router.go('${pg}')"><span class="nav-dot"></span>${NAV_LABELS[pg] || pg}</button>`;
}
function navItemBadge(pg, cur) {
    return `<button class="nav-item ${cur === pg ? 'active' : ''}" onclick="Router.go('${pg}')"><span class="nav-dot"></span>${NAV_LABELS[pg] || pg}</button>`;
}

// ---- Pages / Binders registries ----
const Pages = {};
const Binders = {};
