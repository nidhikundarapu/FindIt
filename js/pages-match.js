// ============================================================
// SMART MATCHING & CLAIMS  (FastAPI Migration)
// ============================================================

Pages.matches = async () => {
  const matches = await API.get('/api/items/matches');
  const lostItems = State.items.filter(i => i.type === 'lost' && i.status !== 'closed');
  const foundItems = State.items.filter(i => i.type === 'found' && i.status !== 'closed');

  return `
  <div class="page-header"><h1>Smart Matching</h1><p>AI-powered keyword, location, and category matching between lost and found items</p></div>

  <div class="grid-3" style="margin-bottom:var(--sp-6)">
    <div class="card card-sm" style="background:var(--lilac-50)"><div style="font-size:22px;font-weight:700">${matches.length}</div><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Potential Matches</div></div>
    <div class="card card-sm" style="background:var(--sage-50)"><div style="font-size:22px;font-weight:700">${matches.filter(m => m.score >= 70).length}</div><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">High Confidence</div></div>
    <div class="card card-sm" style="background:var(--sand-50)"><div style="font-size:22px;font-weight:700">${lostItems.length} / ${foundItems.length}</div><div style="font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Lost / Found Active</div></div>
  </div>

  <div class="card card-sm" style="background:var(--lilac-50);border:1px solid var(--lilac-100);margin-bottom:var(--sp-6)">
    <div style="font-weight:600;color:var(--lilac-500);font-size:14px">How Smart Matching Works</div>
    <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">Strict weighted scoring: title similarity (25pts), category (15pts), brand (15pts), description similarity (15pts), colour (10pts), tags overlap (10pts), location (5pts). Maximum 100%. Matches calculated server-side.</div>
  </div>

  ${!matches.length ? '<div class="empty-state"><h3>No matches yet</h3><p style="color:var(--text-muted)">As more items are reported, matches will appear here.</p></div>' : `
  <div style="display:flex;flex-direction:column;gap:var(--sp-4)">
    ${matches.map((m, idx) => {
    const sc = m.score >= 70 ? 'match-high' : m.score >= 40 ? 'match-medium' : 'match-low';
    const lb = m.score >= 70 ? 'High' : m.score >= 40 ? 'Medium' : 'Low';
    return `<div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-5)">
          <div style="display:flex;align-items:center;gap:var(--sp-3)">
            <span style="font-size:13px;font-weight:700;color:var(--text-muted)">#${idx + 1}</span>
            <span class="match-score ${sc}">${lb} &middot; ${m.score}%</span>
            ${m.lost.category === m.found.category ? '<span class="badge badge-lilac">Same Category</span>' : ''}
            ${m.lost.color && m.found.color && m.lost.color.toLowerCase() === m.found.color.toLowerCase() ? '<span class="badge badge-sage">Same Colour</span>' : ''}
          </div>
          <button class="btn btn-ghost btn-sm" onclick="openItemDetail('${m.lost.id}')">View Lost</button>
        </div>
        <div class="grid-2" style="gap:var(--sp-5)">
          <div class="card card-sm" style="background:var(--rose-50);border:1px solid var(--rose-100)">
            <span class="badge badge-rose" style="margin-bottom:var(--sp-2)">LOST</span>
            <div style="font-weight:700">${escHtml(m.lost.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${escHtml(m.lost.location)} &middot; ${m.lost.date} &middot; ${m.lost.category}</div>
            ${m.lost.color ? `<div style="font-size:12px;color:var(--text-muted)">Colour: ${m.lost.color}</div>` : ''}
            <div style="margin-top:var(--sp-2);display:flex;flex-wrap:wrap;gap:4px">${(m.lost.tags || []).map(t => `<span class="badge badge-sky" style="font-size:10px">${t}</span>`).join('')}</div>
          </div>
          <div class="card card-sm" style="background:var(--sage-50);border:1px solid var(--sage-100)">
            <span class="badge badge-sage" style="margin-bottom:var(--sp-2)">FOUND</span>
            <div style="font-weight:700">${escHtml(m.found.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${escHtml(m.found.location)} &middot; ${m.found.date} &middot; ${m.found.category}</div>
            ${m.found.color ? `<div style="font-size:12px;color:var(--text-muted)">Colour: ${m.found.color}</div>` : ''}
            <div style="margin-top:var(--sp-2);display:flex;flex-wrap:wrap;gap:4px">${(m.found.tags || []).map(t => `<span class="badge badge-sky" style="font-size:10px">${t}</span>`).join('')}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-size:12px;color:var(--text-muted)">Match Score</div>
            <div class="progress-bar" style="width:200px;margin-top:5px"><div class="progress-fill" style="width:${m.score}%;background:${m.score >= 70 ? 'var(--sage-400)' : m.score >= 40 ? 'var(--sand-400)' : 'var(--rose-400)'}"></div></div>
          </div>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn btn-ghost btn-sm" onclick="openItemDetail('${m.found.id}')">View Found</button>
            ${m.lost.userId === State.currentUser?.id || State.currentUser?.role === 'admin' ? `<button class="btn btn-primary btn-sm" onclick="notifyOwner('${m.lost.id}','${m.found.id}')">Notify Owner</button>` : ''}
          </div>
        </div>
      </div>`;
  }).join('')}
  </div>`}
  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;
};

Pages.claims = () => {
  const u = State.currentUser, isAdmin = u?.role === 'admin' || u?.role === 'security';
  const allClaims = isAdmin ? State.claims : State.claims.filter(c => c.claimantId === u.id || State.items.find(i => i.id === c.itemId)?.userId === u.id);
  const pending = allClaims.filter(c => c.status === 'pending');
  const resolved = allClaims.filter(c => c.status !== 'pending');

  return `
  <div class="page-header"><h1>Claims Management</h1><p>${isAdmin ? 'Review and approve all item claims' : 'Track your submitted and received claims'}</p></div>
  <div class="tabs">
    <button class="tab-btn active" onclick="showClaimsTab('pending',this)">Pending (${pending.length})</button>
    <button class="tab-btn" onclick="showClaimsTab('resolved',this)">Resolved (${resolved.length})</button>
  </div>
  <div id="claims-pending">
    ${pending.length ? pending.map(cl => {
    const item = State.items.find(i => i.id === cl.itemId);
    const claimant = State.users.find(x => x.id === cl.claimantId);
    const itemOwner = State.users.find(x => x.id === item?.userId);
    const canApprove = isAdmin || item?.userId === u.id;
    return `<div class="claim-card" style="margin-bottom:var(--sp-4)">
        <div style="display:flex;align-items:flex-start;gap:var(--sp-4);flex-wrap:wrap">
          <div style="flex:1">
            <div style="display:flex;gap:6px;margin-bottom:var(--sp-2);flex-wrap:wrap">
              <span class="badge status-pending">Pending Review</span>
              <span class="badge badge-gray">${item?.ticketId || ''}</span>
            </div>
            <div style="font-weight:700;font-size:15px">${escHtml(item?.title || 'Unknown Item')}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escHtml(item?.location || '')} &middot; ${item?.date || ''}</div>
            <div class="divider" style="margin:var(--sp-3) 0"></div>
            <div style="display:flex;gap:var(--sp-5);flex-wrap:wrap;font-size:13px">
              <div><span style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">Claimant</span><div style="display:flex;align-items:center;gap:var(--sp-2);margin-top:4px"><div class="avatar avatar-sm">${initials(claimant?.name || '?')}</div><div><div style="font-weight:600">${claimant?.name || 'User'}</div><div style="font-size:11px;color:var(--text-muted)">${claimant?.email || ''}</div></div></div></div>
              <div><span style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">Item Owner</span><div style="font-weight:600;margin-top:4px">${itemOwner?.name || 'User'}</div></div>
            </div>
            <div style="margin-top:var(--sp-3);background:var(--lilac-50);padding:var(--sp-3);border-radius:var(--r-md)">
              <div style="font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Proof of Ownership</div>
              <p style="font-size:13px">${escHtml(cl.proof)}</p>
            </div>
            ${canApprove ? `<div style="display:flex;gap:var(--sp-2);margin-top:var(--sp-4)">
              <button class="btn btn-success-soft btn-sm" onclick="approveClaim('${cl.id}','${cl.itemId}')">Approve &amp; Return</button>
              <button class="btn btn-danger-soft btn-sm" onclick="rejectClaim('${cl.id}')">Reject</button>
              <button class="btn btn-ghost btn-sm" onclick="openItemDetail('${cl.itemId}')">View Item</button>
            </div>`: '<div style="font-size:12px;color:var(--text-muted);margin-top:var(--sp-3)">Awaiting owner/admin review</div>'}
          </div>
        </div>
      </div>`;
  }).join('') : '<div class="empty-state"><h3>No pending claims</h3><p style="color:var(--text-muted)">All caught up.</p></div>'}
  </div>
  <div id="claims-resolved" class="hidden">
    ${resolved.length ? resolved.map(cl => {
    const item = State.items.find(i => i.id === cl.itemId);
    const claimant = State.users.find(x => x.id === cl.claimantId);
    return `<div class="claim-card" style="margin-bottom:var(--sp-2)">
        <div style="display:flex;align-items:center;gap:var(--sp-3)">
          <div style="flex:1"><div style="font-weight:600">${escHtml(item?.title || '')}</div><div style="font-size:11px;color:var(--text-muted)">By ${claimant?.name || 'User'} &middot; ${timeAgo(cl.created)}</div></div>
          <span class="badge ${cl.status === 'approved' ? 'status-matched' : 'status-closed'}">${cl.status}</span>
        </div>
      </div>`;
  }).join('') : '<div class="empty-state"><h3>No resolved claims</h3></div>'}
  </div>
  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;
};

function showClaimsTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  document.getElementById('claims-pending').classList.toggle('hidden', tab !== 'pending');
  document.getElementById('claims-resolved').classList.toggle('hidden', tab === 'pending');
}
async function notifyOwner(lostId, foundId) {
  try {
    const lost = State.items.find(i => i.id === lostId), found = State.items.find(i => i.id === foundId);
    await addLog('MATCH_NOTIFY', 'Owner notified: "' + lost?.title + '" matched with "' + found?.title + '"', 'medium');
    toast('Owner has been notified about a potential match.', 'success');
  } catch (e) {
    toast('Failed to notify owner.', 'error');
  }
}

Binders.matches = () => { };
Binders.claims = () => { };
