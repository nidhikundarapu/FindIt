// ============================================================
// DASHBOARD & BROWSE PAGES  (FastAPI Migration)
// ============================================================

function canSeeFullDesc() {
    const role = State.currentUser?.role;
    return role === 'admin' || role === 'security';
}

Pages.dashboard = () => {
    const u = State.currentUser;
    const total = State.items.length;
    const lostCount = State.items.filter(i => i.type === 'lost').length;
    const foundCount = State.items.filter(i => i.type === 'found').length;
    const matched = State.items.filter(i => i.status === 'matched' || i.status === 'closed').length;
    const recentItems = [...State.items].sort((a, b) => b.created - a.created).slice(0, 5);
    const pendingClaims = State.claims.filter(c => c.status === 'pending').length;

    return `
  <div class="topbar">
    <div>
      <h1 style="font-size:22px">Good day, ${escHtml(u.name.split(' ')[0])}</h1>
      <p style="color:var(--text-muted);font-size:13px">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <button class="btn btn-primary" onclick="Router.go('report')">+ Report Item</button>
  </div>

  <div class="grid-4" style="margin-bottom:var(--sp-7)">
    ${dashStat('Total Items', total, 'var(--lilac-50)', 'var(--lilac-400)')}
    ${dashStat('Lost', lostCount, 'var(--rose-50)', 'var(--rose-400)')}
    ${dashStat('Found', foundCount, 'var(--sage-50)', 'var(--sage-400)')}
    ${dashStat('Reunited', matched, 'var(--sand-50)', 'var(--sand-400)')}
  </div>

  ${pendingClaims > 0 && (u.role === 'admin' || u.role === 'security') ? `<div class="alert alert-warning" style="margin-bottom:var(--sp-6)">${pendingClaims} pending claim(s) await review. <a href="#" onclick="Router.go('claims')" style="color:var(--sand-500);font-weight:700">Review claims</a></div>` : ''}

  <div class="grid-2" style="align-items:start">
    <div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-4)">
        <h2 style="font-size:16px;font-weight:600">Recent Items</h2>
        <button class="btn btn-ghost btn-sm" onclick="Router.go('browse')">View all</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--sp-2)">
        ${recentItems.map(it => `
        <div class="card card-sm" style="display:flex;align-items:center;gap:var(--sp-4);cursor:pointer" onclick="openItemDetail('${it.id}')">
          <div style="width:42px;height:42px;border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;letter-spacing:.04em;flex-shrink:0" class="${thumbClass(it.category, it.private)}">${it.category.slice(0, 3).toUpperCase()}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(it.title)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escHtml(it.location)} &middot; ${timeAgo(it.created)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="badge ${it.type === 'lost' ? 'badge-rose' : 'badge-sage'}">${it.type}</span>
            <span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <div>
      <h2 style="font-size:16px;font-weight:600;margin-bottom:var(--sp-4)">Quick Actions</h2>
      <div class="grid-2" style="gap:var(--sp-3);margin-bottom:var(--sp-5)">
        ${qaCard('Report Lost', 'Submit a lost item', 'var(--rose-50)', 'var(--rose-400)', 'report')}
        ${qaCard('Report Found', 'Help someone recover', 'var(--sage-50)', 'var(--sage-400)', 'report')}
        ${qaCard('Smart Match', 'AI-powered matching', 'var(--lilac-50)', 'var(--lilac-400)', 'matches')}
        ${qaCard('Browse All', 'Search all items', 'var(--sky-50)', 'var(--sky-400)', 'browse')}
      </div>
      <div class="card">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:var(--sp-4)">My Pending Claims</h3>
        ${State.claims.filter(c => c.claimantId === u.id).length ? State.claims.filter(c => c.claimantId === u.id).slice(0, 3).map(cl => {
        const it = State.items.find(i => i.id === cl.itemId);
        return `<div style="display:flex;align-items:center;gap:var(--sp-3);padding:8px 0;border-bottom:1px solid var(--border-light)">
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${escHtml(it?.title || 'Unknown Item')}</div></div>
            <span class="badge ${cl.status === 'pending' ? 'status-pending' : cl.status === 'approved' ? 'status-matched' : 'status-closed'}">${cl.status}</span>
          </div>`;
    }).join('') : '<p style="font-size:13px;color:var(--text-muted)">No claims submitted.</p>'}
      </div>
    </div>
  </div>

  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;
};

function dashStat(label, val, bg, accent) {
    return `<div class="card card-sm" style="background:${bg};border:1px solid ${bg}">
    <div style="font-size:24px;font-weight:700;color:var(--text-primary)">${val}</div>
    <div style="font-size:11px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.06em;margin-top:4px">${label}</div>
  </div>`;
}
function qaCard(title, sub, bg, accent, page) {
    return `<div class="card card-sm" style="background:${bg};border:none;cursor:pointer" onclick="Router.go('${page}')">
    <div style="font-size:11px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">${title}</div>
    <div style="font-size:12px;color:var(--text-secondary)">${sub}</div>
  </div>`;
}

// ---- Browse ----
Pages.browse = () => `
  <div class="topbar">
    <div><h1 style="font-size:22px">Browse Items</h1><p style="color:var(--text-muted);font-size:13px">Search and filter all reported items</p></div>
    <button class="btn btn-primary" onclick="Router.go('report')">+ Report Item</button>
  </div>
  <div class="card" style="margin-bottom:var(--sp-5)">
    <div style="display:flex;gap:var(--sp-4);flex-wrap:wrap;align-items:flex-end">
      <div style="flex:1;min-width:180px">
        <div class="search-bar">
          <span class="search-icon">${Icons.search}</span>
          <input id="browse-search" placeholder="Search items..." oninput="filterBrowse()">
        </div>
      </div>
      <select class="form-control" id="browse-type" onchange="filterBrowse()" style="width:auto">
        <option value="">All Types</option><option value="lost">Lost</option><option value="found">Found</option>
      </select>
      <select class="form-control" id="browse-cat" onchange="filterBrowse()" style="width:auto">
        <option value="">All Categories</option>
        <option>Electronics</option><option>Accessories</option><option>Bags</option>
        <option>Keys</option><option>Jewelry</option><option>Documents</option><option>Clothing</option><option>Other</option>
      </select>
      <select class="form-control" id="browse-status" onchange="filterBrowse()" style="width:auto">
        <option value="">All Status</option><option value="open">Open</option><option value="matched">Matched</option><option value="closed">Closed</option>
      </select>
    </div>
  </div>
  <div class="tabs">
    <button class="tab-btn active" onclick="setBrowseView('grid',this)">Grid</button>
    <button class="tab-btn" onclick="setBrowseView('list',this)">List</button>
  </div>
  <div id="browse-results"></div>
  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;

function setBrowseView(view, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    window._browseView = view; filterBrowse();
}

function filterBrowse() {
    const q = document.getElementById('browse-search')?.value.toLowerCase() || '';
    const type = document.getElementById('browse-type')?.value || '';
    const cat = document.getElementById('browse-cat')?.value || '';
    const status = document.getElementById('browse-status')?.value || '';
    const view = window._browseView || 'grid';
    let items = State.items.filter(it => {
        // Backend handles most visibility filtering, but we re-filter for safety and search.
        const mQ = !q || it.title.toLowerCase().includes(q) || (canSeeFullDesc() && it.desc.toLowerCase().includes(q)) || it.location.toLowerCase().includes(q);
        return mQ && (!type || it.type === type) && (!cat || it.category === cat) && (!status || it.status === status);
    });
    const c = document.getElementById('browse-results'); if (!c) return;
    if (!items.length) { c.innerHTML = `<div class="empty-state"><h3>No items found</h3><p style="color:var(--text-muted)">Try adjusting your filters.</p></div>`; return; }
    if (view === 'grid') {
        c.innerHTML = `<div class="grid-3">${items.map(itemCard).join('')}</div>`;
    } else {
        c.innerHTML = `<div class="card p-0 table-wrap"><table>
      <thead><tr><th>Item</th><th>Type</th><th>Category</th><th>Location</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody>${items.map(it => `<tr>
        <td><strong style="font-size:13px">${escHtml(it.title)}</strong></td>
        <td><span class="badge ${it.type === 'lost' ? 'badge-rose' : 'badge-sage'}">${it.type}</span></td>
        <td style="font-size:13px">${escHtml(it.category)}</td>
        <td style="font-size:13px">${escHtml(it.location)}</td>
        <td style="font-size:13px">${it.date}</td>
        <td><span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span></td>
        <td><button class="btn btn-ghost btn-sm" onclick="openItemDetail('${it.id}')">View</button></td>
      </tr>`).join('')}</tbody></table></div>`;
    }
}

function itemCard(it) {
    return `<div class="item-card" onclick="openItemDetail('${it.id}')">
    <div class="item-card-thumb ${thumbClass(it.category, it.private)}">${it.private ? 'Private' : it.category}</div>
    <div class="item-card-body">
      <div style="display:flex;gap:5px;margin-bottom:var(--sp-2)">
        <span class="badge ${it.type === 'lost' ? 'badge-rose' : 'badge-sage'}">${it.type}</span>
        <span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span>
        ${it.escalated ? '<span class="badge status-escalated">Escalated</span>' : ''}
      </div>
      <div class="item-card-title">${escHtml(it.title)}</div>
      <div class="item-card-meta"><span>${escHtml(it.location)}</span><span>${it.date}</span></div>
    </div>
  </div>`;
}

function openItemDetail(id) {
    const it = State.items.find(i => i.id === id); if (!it) return;
    const u = State.currentUser;
    const isOwner = it.userId === u?.id;
    const reporter = State.users.find(x => x.id === it.userId);
    const existingClaim = State.claims.find(c => c.itemId === id && c.claimantId === u?.id);
    const itemClaims = State.claims.filter(c => c.itemId === id);
    const modal = document.getElementById('item-modal'); if (!modal) return;
    modal.innerHTML = `
    <div class="modal-header">
      <div>
        <div class="modal-title">${escHtml(it.title)}</div>
        <div style="display:flex;gap:5px;margin-top:4px">
          <span class="badge ${it.type === 'lost' ? 'badge-rose' : 'badge-sage'}">${it.type}</span>
          <span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span>
          ${it.private ? '<span class="badge badge-gray">Private</span>' : ''}
          ${it.escalated ? '<span class="badge status-escalated">Escalated</span>' : ''}
        </div>
      </div>
      <button class="modal-close" onclick="closeItemModal()">&#x2715;</button>
    </div>
    <div class="ticket" style="margin-bottom:var(--sp-5)">
      <div class="ticket-label">Ticket ID</div>
      <div class="ticket-id">${it.ticketId}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);margin-top:var(--sp-4)">
        <div><div class="ticket-label">Category</div><div class="ticket-detail">${it.category}</div></div>
        <div><div class="ticket-label">Reported by</div><div class="ticket-detail">${reporter?.name || 'User'}</div></div>
        <div><div class="ticket-label">Date / Time</div><div class="ticket-detail">${it.date} ${it.time || ''}</div></div>
        <div><div class="ticket-label">Location</div><div class="ticket-detail">${it.location}</div></div>
      </div>
    </div>
    ${canSeeFullDesc() || isOwner ? `<div class="card card-sm" style="margin-bottom:var(--sp-4)">
      <p style="font-size:13px;color:var(--text-secondary)">${escHtml(it.desc)}</p>
      ${it.color || it.brand ? `<div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-3)">
        ${it.color ? `<span class="badge badge-gray">Colour: ${it.color}</span>` : ''}
        ${it.brand ? `<span class="badge badge-lilac">Brand: ${it.brand}</span>` : ''}
      </div>`: ''}
    </div>
    ${(it.tags || []).length ? `<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:var(--sp-4)">${it.tags.map(t => `<span class="badge badge-sky">${t}</span>`).join('')}</div>` : ''}` : `<div class="card card-sm" style="margin-bottom:var(--sp-4);background:var(--gray-50)">
      <p style="font-size:13px;color:var(--text-muted);font-style:italic">Item details are hidden. Contact an admin or security staff for full information.</p>
    </div>`}
    ${!isOwner && it.type === 'found' && it.status !== 'closed' ? `
    <div id="claim-alert" style="margin-bottom:var(--sp-2)"></div>
    ${existingClaim ? `<div class="alert alert-info">You already submitted a claim &mdash; Status: <strong>${existingClaim.status}</strong></div>` : `
    <div class="card card-sm" style="background:var(--lilac-50);border:1px solid var(--lilac-100);margin-bottom:var(--sp-4)">
      <h4 style="font-size:14px;font-weight:600;margin-bottom:var(--sp-3)">Claim This Item</h4>
      <textarea class="form-control" id="claim-proof" placeholder="Describe proof of ownership..." rows="3"></textarea>
      <button class="btn btn-primary btn-full" style="margin-top:var(--sp-3)" onclick="submitClaim('${it.id}')">Submit Claim</button>
    </div>`}` : ''}
    ${isOwner && it.status === 'open' ? `<div style="display:flex;gap:var(--sp-2);margin-bottom:var(--sp-3)">
      <button class="btn btn-success-soft btn-sm" onclick="markClosed('${it.id}')">Mark as Closed</button>
      <button class="btn btn-danger-soft btn-sm" onclick="deleteItem('${it.id}')">Delete</button>
    </div>`: ''}
    ${u?.role === 'admin' && !it.escalated ? `<button class="btn btn-ghost btn-sm" onclick="escalateItem('${it.id}')">Escalate</button>` : ''}
    ${itemClaims.length && (isOwner || u?.role === 'admin' || u?.role === 'security') ? `
    <div class="divider"></div>
    <h4 style="font-size:14px;font-weight:600;margin-bottom:var(--sp-3)">Claims (${itemClaims.length})</h4>
    ${itemClaims.map(cl => {
        const claimant = State.users.find(x => x.id === cl.claimantId);
        return `<div class="claim-card" style="margin-bottom:var(--sp-3)">
        <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-2)">
          <div class="avatar avatar-sm">${initials(claimant?.name || '?')}</div>
          <div style="flex:1"><strong style="font-size:13px">${claimant?.name || 'User'}</strong></div>
          <span class="badge ${cl.status === 'pending' ? 'status-pending' : cl.status === 'approved' ? 'status-matched' : 'status-closed'}">${cl.status}</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary)">${escHtml(cl.proof)}</p>
        ${cl.status === 'pending' && (isOwner || u?.role === 'admin') ? `<div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-3)">
          <button class="btn btn-success-soft btn-sm" onclick="approveClaim('${cl.id}','${it.id}')">Approve</button>
          <button class="btn btn-danger-soft btn-sm" onclick="rejectClaim('${cl.id}')">Reject</button>
        </div>`: ''}
      </div>`;
    }).join('')}` : ''}`;
    document.getElementById('item-modal-overlay').classList.add('open');
}

function closeItemModal(e) { if (!e || e.target.id === 'item-modal-overlay') document.getElementById('item-modal-overlay')?.classList.remove('open'); }

async function submitClaim(itemId) {
    const proof = document.getElementById('claim-proof')?.value.trim();
    if (!proof) { document.getElementById('claim-alert').innerHTML = '<div class="alert alert-error">Please describe your proof of ownership.</div>'; return; }
    try {
        await API.post('/api/claims', { itemId, proof });
        toast('Claim submitted.', 'success');
        closeItemModal();
        Router.render();
    } catch (e) {
        toast(e.message, 'error');
    }
}
async function approveClaim(claimId, itemId) {
    try {
        await API.put(`/api/claims/${claimId}`, { status: 'approved' });
        toast('Claim approved. Item matched.', 'success');
        closeItemModal();
        Router.render();
    } catch (e) { toast(e.message, 'error'); }
}
async function rejectClaim(claimId) {
    try {
        await API.put(`/api/claims/${claimId}`, { status: 'rejected' });
        toast('Claim rejected.', 'info');
        closeItemModal();
        Router.render();
    } catch (e) { toast(e.message, 'error'); }
}
async function markClosed(itemId) {
    try {
        await API.put(`/api/items/${itemId}`, { status: 'closed' });
        toast('Item closed.', 'success');
        closeItemModal();
        Router.render();
    } catch (e) { toast(e.message, 'error'); }
}
async function deleteItem(itemId) {
    if (!confirm('Delete this item?')) return;
    try {
        await API.del(`/api/items/${itemId}`);
        toast('Item deleted.', 'info');
        closeItemModal();
        Router.render();
    } catch (e) { toast(e.message, 'error'); }
}
async function escalateItem(itemId) {
    try {
        await API.put(`/api/items/${itemId}`, { escalated: true });
        toast('Item escalated to security.', 'info');
        closeItemModal();
        Router.render();
    } catch (e) { toast(e.message, 'error'); }
}

Binders.dashboard = () => { };
Binders.browse = () => { window._browseView = 'grid'; filterBrowse(); };
