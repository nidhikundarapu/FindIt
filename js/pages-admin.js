// ============================================================
// ADMIN PANEL & SECURITY DASHBOARD  (FastAPI Migration)
// ============================================================

Pages.admin = () => {
  if (State.currentUser?.role !== 'admin') return '<div class="empty-state"><h3>Access Denied</h3><p style="color:var(--text-muted)">You need admin privileges to view this page.</p></div>';
  const pending = State.claims.filter(c => c.status === 'pending');
  const escalated = State.items.filter(i => i.escalated);
  const totalUsers = State.users.length;
  const openItems = State.items.filter(i => i.status === 'open').length;

  return `
  <div class="page-header"><h1>Admin Panel</h1><p>Manage users, items, claims, and system settings</p></div>
  <div class="grid-4" style="margin-bottom:var(--sp-6)">
    ${[['Users', totalUsers, 'var(--lilac-50)'], ['Open Items', openItems, 'var(--sand-50)'], ['Pending Claims', pending.length, 'var(--sky-50)'], ['Escalated', escalated.length, 'var(--rose-50)']].map(([l, v, bg]) => `
    <div class="card card-sm" style="background:${bg}"><div style="font-size:22px;font-weight:700">${v}</div><div style="font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em">${l}</div></div>`).join('')}
  </div>

  <div class="tabs">
    <button class="tab-btn active" onclick="showAdminTab('users',this)">Users</button>
    <button class="tab-btn" onclick="showAdminTab('items',this)">All Items</button>
    <button class="tab-btn" onclick="showAdminTab('escalated',this)">Escalated</button>
    <button class="tab-btn" onclick="showAdminTab('claims-admin',this)">Claims</button>
  </div>

  <div id="admin-users">
    <div class="card p-0 table-wrap"><table>
      <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Reports</th><th>Actions</th></tr></thead>
      <tbody>${State.users.map(u => {
    const reports = State.items.filter(i => i.userId === u.id).length;
    return `<tr>
          <td><div style="display:flex;align-items:center;gap:var(--sp-2)"><div class="avatar avatar-sm">${initials(u.name)}</div><strong style="font-size:13px">${escHtml(u.name)}</strong></div></td>
          <td style="font-size:13px">${escHtml(u.email)}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-lilac' : u.role === 'security' ? 'badge-sky' : 'badge-sage'}">${u.role}</span></td>
          <td style="font-size:13px">${u.joined}</td>
          <td>${reports}</td>
          <td><select class="form-control" style="padding:4px 8px;font-size:12px;width:auto" onchange="changeRole('${u.id}',this.value)">
            <option ${u.role === 'user' ? 'selected' : ''} value="user">User</option>
            <option ${u.role === 'admin' ? 'selected' : ''} value="admin">Admin</option>
            <option ${u.role === 'security' ? 'selected' : ''} value="security">Security</option>
          </select></td>
        </tr>`;
  }).join('')}</tbody>
    </table></div>
  </div>

  <div id="admin-items" class="hidden">
    <div class="card p-0 table-wrap"><table>
      <thead><tr><th>Item</th><th>Type</th><th>Reporter</th><th>Location</th><th>Status</th><th>Flags</th><th>Actions</th></tr></thead>
      <tbody>${State.items.map(it => {
    const rep = State.users.find(u => u.id === it.userId);
    return `<tr>
          <td><strong style="font-size:13px">${escHtml(it.title)}</strong><br><span style="font-size:11px;color:var(--text-muted)">${it.ticketId}</span></td>
          <td><span class="badge ${it.type === 'lost' ? 'badge-rose' : 'badge-sage'}">${it.type}</span></td>
          <td style="font-size:13px">${rep?.name || 'User'}</td>
          <td style="font-size:13px">${escHtml(it.location)}</td>
          <td><span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span></td>
          <td>${it.private ? '<span class="badge badge-gray">Private</span>' : ''}${it.escalated ? '<span class="badge status-escalated">Esc.</span>' : ''}</td>
          <td><div style="display:flex;gap:4px"><button class="btn btn-ghost btn-sm" onclick="openItemDetail('${it.id}')">View</button><button class="btn btn-danger-soft btn-sm" onclick="adminDeleteItem('${it.id}')">Del</button></div></td>
        </tr>`;
  }).join('')}</tbody>
    </table></div>
  </div>

  <div id="admin-escalated" class="hidden">
    ${escalated.length ? escalated.map(it => {
    const rep = State.users.find(u => u.id === it.userId);
    return `<div class="card" style="margin-bottom:var(--sp-3);border-left:3px solid var(--rose-300)">
        <div style="display:flex;align-items:center;gap:var(--sp-4);flex-wrap:wrap">
          <div style="flex:1">
            <div style="display:flex;gap:6px;margin-bottom:4px"><span class="badge status-escalated">Escalated</span><span class="badge badge-gray">${it.ticketId}</span>${it.private ? '<span class="badge badge-gray">Private</span>' : ''}</div>
            <div style="font-weight:700">${escHtml(it.title)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escHtml(it.location)} &middot; Reported by ${rep?.name || 'User'}</div>
          </div>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn btn-success-soft btn-sm" onclick="resolveEscalation('${it.id}')">Resolve</button>
            <button class="btn btn-ghost btn-sm" onclick="openItemDetail('${it.id}')">View</button>
          </div>
        </div>
      </div>`;
  }).join('') : '<div class="empty-state"><h3>No escalated items</h3></div>'}
  </div>

  <div id="admin-claims-admin" class="hidden">
    ${State.claims.map(cl => {
    const item = State.items.find(i => i.id === cl.itemId);
    const claimant = State.users.find(u => u.id === cl.claimantId);
    return `<div class="claim-card" style="margin-bottom:var(--sp-2)">
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <div style="flex:1"><div style="font-weight:600">${escHtml(item?.title || '')} <span class="badge badge-gray" style="font-size:10px">${item?.ticketId || ''}</span></div>
            <div style="font-size:11px;color:var(--text-muted)">Claimant: ${claimant?.name || 'User'} &middot; ${timeAgo(cl.created)}</div>
          </div>
          <span class="badge ${cl.status === 'pending' ? 'status-pending' : cl.status === 'approved' ? 'status-matched' : 'status-closed'}">${cl.status}</span>
          ${cl.status === 'pending' ? `<div style="display:flex;gap:4px">
            <button class="btn btn-success-soft btn-sm" onclick="approveClaim('${cl.id}','${cl.itemId}')">Approve</button>
            <button class="btn btn-danger-soft btn-sm" onclick="rejectClaim('${cl.id}')">Reject</button>
          </div>`: ''}
        </div>
      </div>`;
  }).join('')}
  </div>
  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;
};

Pages.security = () => {
  const u = State.currentUser;
  if (u?.role !== 'admin' && u?.role !== 'security') return '<div class="empty-state"><h3>Access Denied</h3></div>';
  const escalated = State.items.filter(i => i.escalated);
  const private_ = State.items.filter(i => i.private);
  const highLogs = State.logs.filter(l => l.severity === 'high');

  return `
  <div class="page-header"><h1>Security Dashboard</h1><p>Monitor sensitive cases, escalations, and activity logs</p></div>
  <div class="grid-4" style="margin-bottom:var(--sp-6)">
    ${[['Escalated', escalated.length, 'var(--rose-50)'], ['Private Cases', private_.length, 'var(--lilac-50)'], ['High Severity', highLogs.length, 'var(--sand-50)'], ['Total Logs', State.logs.length, 'var(--sage-50)']].map(([l, v, bg]) => `
    <div class="card card-sm" style="background:${bg}"><div style="font-size:22px;font-weight:700">${v}</div><div style="font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em">${l}</div></div>`).join('')}
  </div>

  <div class="grid-2" style="align-items:start">
    <div>
      <h2 style="font-size:16px;font-weight:600;margin-bottom:var(--sp-4)">Escalated &amp; Sensitive Cases</h2>
      ${escalated.length || private_.length ? [...escalated, ...private_.filter(p => !p.escalated)].map(it => {
    const rep = State.users.find(u => u.id === it.userId);
    return `<div class="card card-sm" style="margin-bottom:var(--sp-2);border-left:3px solid ${it.escalated ? 'var(--rose-300)' : 'var(--lilac-300)'}">
          <div style="display:flex;align-items:center;gap:var(--sp-3)">
            <div style="flex:1">
              <div style="display:flex;gap:5px;margin-bottom:2px">
                ${it.escalated ? '<span class="badge status-escalated">Escalated</span>' : ''}
                ${it.private ? '<span class="badge badge-gray">Private</span>' : ''}
                <span class="badge badge-gray">${it.ticketId}</span>
              </div>
              <div style="font-weight:600">${escHtml(it.title)}</div>
              <div style="font-size:11px;color:var(--text-muted)">${escHtml(it.location)} &middot; By ${rep?.name || 'User'}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${it.escalated ? `<button class="btn btn-ghost btn-sm" onclick="resolveEscalation('${it.id}')">Resolve</button>` : ''}
              <button class="btn btn-ghost btn-sm" onclick="openItemDetail('${it.id}')">View</button>
            </div>
          </div>
        </div>`;
  }).join('') : '<div class="empty-state" style="padding:var(--sp-7)"><h3>All clear</h3></div>'}

      <h2 style="font-size:16px;font-weight:600;margin-top:var(--sp-7);margin-bottom:var(--sp-4)">Anonymous Return System</h2>
      <div class="card" style="background:var(--lilac-50);border:1px solid var(--lilac-100)">
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:var(--sp-4)">Security officers can facilitate anonymous handoffs &mdash; the finder&rsquo;s identity is never revealed to the claimant.</p>
        <div class="form-group"><label class="form-label">Ticket ID</label><input class="form-control" id="anon-ticket" placeholder="e.g. TKT-0004"></div>
        <div class="form-group"><label class="form-label">Handoff Notes (internal)</label><textarea class="form-control" id="anon-notes" rows="2" placeholder="Describe the handoff arrangement..."></textarea></div>
        <button class="btn btn-primary" id="anon-btn" onclick="logAnonReturn()">Log Anonymous Return</button>
      </div>
    </div>

    <div>
      <h2 style="font-size:16px;font-weight:600;margin-bottom:var(--sp-4)">Activity Logs</h2>
      <div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-4)">
        <button class="btn btn-ghost btn-sm" onclick="filterLogs('')">All</button>
        <button class="btn btn-ghost btn-sm" onclick="filterLogs('high')">High</button>
        <button class="btn btn-ghost btn-sm" onclick="filterLogs('medium')">Medium</button>
        <button class="btn btn-ghost btn-sm" onclick="filterLogs('low')">Low</button>
      </div>
      <div id="log-container" style="max-height:500px;overflow-y:auto">${renderLogs('')}</div>
    </div>
  </div>
  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;
};

function renderLogs(severity) {
  const logs = severity ? State.logs.filter(l => l.severity === severity) : State.logs;
  if (!logs.length) return '<div class="empty-state" style="padding:var(--sp-6)"><h3>No logs</h3></div>';
  return logs.slice(0, 60).map(l => {
    const user = State.users.find(u => u.id === l.userId);
    const cls = l.severity === 'high' ? 'log-severity-high' : l.severity === 'medium' ? 'log-severity-medium' : 'log-severity-low';
    const dotCls = l.severity === 'high' ? 'log-dot-high' : l.severity === 'medium' ? 'log-dot-medium' : 'log-dot-low';
    return `<div class="log-row ${cls}"><span class="log-dot ${dotCls}"></span><span class="log-event">${escHtml(l.desc)}</span><span class="log-user">${user?.name || 'System'}</span><span class="log-time">${timeAgo(l.time)}</span></div>`;
  }).join('');
}

function filterLogs(severity) {
  const c = document.getElementById('log-container'); if (c) c.innerHTML = renderLogs(severity);
}

function showAdminTab(tab, btn) {
  ['users', 'items', 'escalated', 'claims-admin'].forEach(t => {
    const el = document.getElementById('admin-' + t); if (el) el.classList.toggle('hidden', t !== tab);
  });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
}

async function changeRole(userId, newRole) {
  try {
    await API.put(`/api/admin/users/${userId}/role`, { role: newRole });
    toast('Role updated to ' + newRole + '.', 'success');
    Router.render();
  } catch (e) {
    toast(e.message, 'error');
  }
}
async function adminDeleteItem(itemId) {
  if (!confirm('Delete this item permanently?')) return;
  try {
    await API.del(`/api/items/${itemId}`);
    toast('Item deleted.', 'info');
    Router.render();
  } catch (e) { toast(e.message, 'error'); }
}
async function resolveEscalation(itemId) {
  try {
    await API.put(`/api/items/${itemId}`, { escalated: false });
    toast('Escalation resolved.', 'success');
    Router.render();
  } catch (e) { toast(e.message, 'error'); }
}
async function logAnonReturn() {
  const ticket = document.getElementById('anon-ticket')?.value.trim();
  const notes = document.getElementById('anon-notes')?.value.trim();
  const btn = document.getElementById('anon-btn');
  if (!ticket) { toast('Please enter a ticket ID.', 'error'); return; }
  
  try {
    btn.disabled = true;
    const it = State.items.find(i => i.ticketId === ticket);
    if (!it) throw new Error('Ticket not found');
    
    await Promise.all([
        API.put(`/api/items/${it.id}`, { status: 'closed' }),
        addLog('ANON_RETURN', 'Anonymous return logged for ' + ticket + ': ' + (notes || 'No notes'), 'high')
    ]);
    
    toast('Anonymous return logged for ' + ticket + '.', 'success');
    Router.render();
  } catch (e) {
    toast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

Binders.admin = () => { };
Binders.security = () => { };
