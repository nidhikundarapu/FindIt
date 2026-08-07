// ============================================================
// AUTH PAGES — Login, Register, Profile  (FastAPI Migration)
// ============================================================

Pages.login = () => `
<div class="auth-page">
  <div class="auth-left">
    <div style="text-align:center;max-width:340px">
      <div style="width:64px;height:64px;border-radius:var(--r-xl);background:var(--lilac-200);margin:0 auto var(--sp-6);display:flex;align-items:center;justify-content:center">
        ${Icons.logo}
      </div>
      <h2 style="font-size:26px;font-weight:700;margin-bottom:var(--sp-3)">FindIt</h2>
      <p style="color:var(--text-secondary);font-size:14px;line-height:1.7">A smart Lost &amp; Found platform — reuniting people with their belongings.</p>
      <div style="display:flex;gap:var(--sp-4);justify-content:center;margin-top:var(--sp-7);flex-wrap:wrap">
        ${statPill(State.items.length, 'Items Listed')}
        ${statPill(State.items.filter(i => i.status === 'matched' || i.status === 'closed').length, 'Reunited')}
        <div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-3) var(--sp-4);min-width:90px">
          <div style="font-size:22px;font-weight:700;color:var(--lilac-500)">+</div>
          <div style="font-size:11px;color:var(--text-muted)">Community-driven</div>
        </div>
      </div>
    </div>
  </div>
  <div class="auth-right">
    <div class="auth-form-wrap">
      <h2 style="font-size:22px;font-weight:700;margin-bottom:var(--sp-2)">Welcome back</h2>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:var(--sp-7)">Sign in to your account</p>
      <div id="auth-alert"></div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="login-email" type="text" placeholder="you@example.com" value="admin@lf.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-control" id="login-pass" type="password" placeholder="Password" value="admin123">
      </div>
      <button class="btn btn-primary btn-full btn-lg" id="login-btn" onclick="doLogin()">Sign In</button>
      <div class="divider"></div>
      <p style="text-align:center;font-size:13px;color:var(--text-muted)">No account? <a href="#" onclick="Router.go('register')" style="color:var(--lilac-500);font-weight:600">Register</a></p>
      <div style="margin-top:var(--sp-6);padding:var(--sp-4);background:var(--lilac-50);border-radius:var(--r-md);border:1px solid var(--lilac-100)">
        <p style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-3)">Demo Accounts</p>
        <div style="display:flex;flex-direction:column;gap:var(--sp-2);font-size:12px;color:var(--text-secondary)">
          <span>Admin — admin@lf.com / admin123</span>
          <span>User — alice@lf.com / alice123</span>
          <span>Security — security@lf.com / sec123</span>
        </div>
      </div>
    </div>
  </div>
</div>`;

Pages.register = () => `
<div class="auth-page">
  <div class="auth-left">
    <div style="text-align:center;max-width:300px">
      <div style="width:64px;height:64px;border-radius:var(--r-xl);background:var(--sage-100);margin:0 auto var(--sp-6);display:flex;align-items:center;justify-content:center">
        ${Icons.logo}
      </div>
      <h2 style="font-size:24px;font-weight:700;">Join FindIt</h2>
      <p style="color:var(--text-secondary);margin-top:var(--sp-3);font-size:14px">Help reunite lost items with their owners in your community.</p>
    </div>
  </div>
  <div class="auth-right">
    <div class="auth-form-wrap">
      <h2 style="font-size:22px;font-weight:700;margin-bottom:var(--sp-2)">Create account</h2>
      <p style="color:var(--text-muted);font-size:13px;margin-bottom:var(--sp-6)">Join the FindIt community</p>
      <div id="auth-alert"></div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-control" id="reg-name" type="text" placeholder="Jane Doe">
        </div>
        <div class="form-group">
          <label class="form-label">Phone</label>
          <input class="form-control" id="reg-phone" type="tel" placeholder="555-0000">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="reg-email" type="text" placeholder="you@example.com">
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input class="form-control" id="reg-pass" type="password" placeholder="Min. 6 characters">
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-control" id="reg-role">
          <option value="user">Regular User</option>
          <option value="security">Security Officer</option>
        </select>
      </div>
      <button class="btn btn-primary btn-full btn-lg" id="reg-btn" onclick="doRegister()">Create Account</button>
      <div class="divider"></div>
      <p style="text-align:center;font-size:13px;color:var(--text-muted)">Already have an account? <a href="#" onclick="Router.go('login')" style="color:var(--lilac-500);font-weight:600">Sign In</a></p>
    </div>
  </div>
</div>`;

Pages.profile = () => {
    const u = State.currentUser;
    const myItems = State.items.filter(i => i.userId === u.id);
    const myClaims = State.claims.filter(c => c.claimantId === u.id);
    return `
  <div class="page-header"><h1>My Profile</h1><p>Manage your account details</p></div>
  <div class="grid-2" style="align-items:start">
    <div>
      <div class="card" style="margin-bottom:var(--sp-5)">
        <div style="text-align:center;margin-bottom:var(--sp-6)">
          <div class="avatar avatar-xl" style="margin:0 auto var(--sp-4)">${initials(u.name)}</div>
          <h2 style="font-size:18px">${escHtml(u.name)}</h2>
          <p style="font-size:13px;color:var(--text-muted)">${u.email}</p>
          <span class="badge badge-lilac" style="margin-top:var(--sp-2)">${u.role}</span>
        </div>
        <div class="divider"></div>
        <div id="profile-alert"></div>
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="pf-name" value="${escHtml(u.name)}"></div>
        <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="pf-phone" value="${escHtml(u.phone || '')}"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-control" id="pf-email" value="${escHtml(u.email)}" disabled></div>
        <div class="form-group"><label class="form-label">New Password (leave blank to keep)</label><input class="form-control" id="pf-pass" type="password" placeholder="New password"></div>
        <button class="btn btn-primary btn-full" id="pf-save-btn" onclick="saveProfile()">Save Changes</button>
      </div>
      <div class="card">
        <h3 style="font-size:15px;margin-bottom:var(--sp-4)">Danger Zone</h3>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:var(--sp-4)">Sign out of your current session.</p>
        <button class="btn btn-danger-soft btn-full" onclick="State.logout()">Sign Out</button>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:var(--sp-5)">
        <h3 style="font-size:15px;margin-bottom:var(--sp-5)">Activity Overview</h3>
        <div class="grid-2" style="gap:var(--sp-3)">
          ${[['Reports', myItems.length, 'var(--lilac-50)'], ['Claims', myClaims.length, 'var(--sage-50)'], ['Lost', myItems.filter(i => i.type === 'lost').length, 'var(--rose-50)'], ['Found', myItems.filter(i => i.type === 'found').length, 'var(--sky-50)']].map(([l, v, bg]) => `
          <div style="background:${bg};border-radius:var(--r-md);padding:var(--sp-4)">
            <div style="font-size:22px;font-weight:700;color:var(--text-primary)">${v}</div>
            <div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">${l}</div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <h3 style="font-size:15px;margin-bottom:var(--sp-4)">Recent Reports</h3>
        ${myItems.length ? myItems.slice(0, 4).map(it => `
        <div style="display:flex;align-items:center;gap:var(--sp-3);padding:10px 0;border-bottom:1px solid var(--border-light)">
          <div style="width:36px;height:36px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;text-transform:uppercase" class="${thumbClass(it.category, it.private)}">${it.category.slice(0, 3)}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${escHtml(it.title)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${it.date} — ${it.location}</div>
          </div>
          <span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span>
        </div>`).join('') : '<p style="font-size:13px;color:var(--text-muted)">No reports yet.</p>'}
      </div>
    </div>
  </div>`;
};

function statPill(val, label) {
    return `<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r-md);padding:var(--sp-3) var(--sp-4);min-width:90px">
    <div style="font-size:22px;font-weight:700;color:var(--lilac-500)">${val}</div>
    <div style="font-size:11px;color:var(--text-muted)">${label}</div>
  </div>`;
}

// ---- Auth actions ----
async function doLogin() {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-pass')?.value;
    const alertEl = document.getElementById('auth-alert');
    const btn = document.getElementById('login-btn');
    
    if (!email || !password) { alertEl.innerHTML = '<div class="alert alert-error">Please enter credentials.</div>'; return; }
    
    try {
        btn.disabled = true; btn.textContent = 'Signing in...';
        const { access_token } = await API.post('/api/auth/login', { email, password });
        API.token = access_token;
        const user = await API.get('/api/auth/me');
        State.login(access_token, user);
        toast(`Welcome back, ${user.name}!`, 'info');
        Router.go('dashboard');
    } catch (err) {
        alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
        btn.disabled = false; btn.textContent = 'Sign In';
    }
}

async function doRegister() {
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-pass')?.value;
    const phone = document.getElementById('reg-phone')?.value.trim();
    const role = document.getElementById('reg-role')?.value;
    const alertEl = document.getElementById('auth-alert');
    const btn = document.getElementById('reg-btn');
    
    if (!name || !email || !password) { alertEl.innerHTML = '<div class="alert alert-error">Please fill all required fields.</div>'; return; }
    if (password.length < 6) { alertEl.innerHTML = '<div class="alert alert-error">Password must be at least 6 characters.</div>'; return; }
    
    try {
        btn.disabled = true; btn.textContent = 'Creating account...';
        const { access_token } = await API.post('/api/auth/register', { name, email, password, phone, role });
        API.token = access_token;
        const user = await API.get('/api/auth/me');
        State.login(access_token, user);
        toast('Account created! Welcome to FindIt.', 'success');
        Router.go('dashboard');
    } catch (err) {
        alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
        btn.disabled = false; btn.textContent = 'Create Account';
    }
}

async function saveProfile() {
    const name = document.getElementById('pf-name')?.value.trim();
    const phone = document.getElementById('pf-phone')?.value.trim();
    const password = document.getElementById('pf-pass')?.value;
    const alertEl = document.getElementById('profile-alert');
    const btn = document.getElementById('pf-save-btn');
    
    if (!name) { alertEl.innerHTML = '<div class="alert alert-error">Name cannot be empty.</div>'; return; }
    
    try {
        btn.disabled = true;
        const updated = await API.put('/api/auth/profile', { name, phone, ...(password ? { password } : {}) });
        State.currentUser = updated;
        alertEl.innerHTML = '<div class="alert alert-success">Profile updated.</div>';
        toast('Profile updated.', 'success');
    } catch (err) {
        alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
        btn.disabled = false;
    }
}

Binders.login = () => { document.getElementById('login-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); }); };
Binders.register = () => { };
Binders.profile = () => { };
