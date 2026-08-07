// ============================================================
// REPORT ITEM & MY REPORTS  (FastAPI Migration)
// ============================================================

Pages.report = () => `
  <div class="page-header"><h1>Report an Item</h1><p>Submit a lost or found item report. A ticket will be generated automatically.</p></div>
  <div class="grid-2" style="align-items:start">
    <div class="card">
      <div id="report-alert"></div>
      <div class="form-group">
        <label class="form-label">Report Type</label>
        <div style="display:flex;gap:var(--sp-4)">
          <label style="flex:1;cursor:pointer">
            <input type="radio" name="rtype" value="lost" checked style="display:none">
            <div class="card card-sm" id="rtype-lost-card" style="text-align:center;border:2px solid var(--rose-300);background:var(--rose-50);transition:all .2s" onclick="selectType('lost')">
              <div style="font-weight:700;color:var(--rose-400)">I Lost It</div>
            </div>
          </label>
          <label style="flex:1;cursor:pointer">
            <input type="radio" name="rtype" value="found" style="display:none">
            <div class="card card-sm" id="rtype-found-card" style="text-align:center;border:2px solid var(--border);transition:all .2s" onclick="selectType('found')">
              <div style="font-weight:700;color:var(--sage-400)">I Found It</div>
            </div>
          </label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Item Title *</label><input class="form-control" id="r-title" placeholder="e.g. Black Leather Wallet"></div>
        <div class="form-group"><label class="form-label">Category *</label>
          <select class="form-control" id="r-cat"><option>Electronics</option><option>Accessories</option><option>Bags</option><option>Keys</option><option>Jewelry</option><option>Documents</option><option>Clothing</option><option>Other</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Description *</label><textarea class="form-control" id="r-desc" rows="3" placeholder="Describe the item in detail..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Location *</label><input class="form-control" id="r-loc" placeholder="e.g. Library, 2nd Floor"></div>
        <div class="form-group"><label class="form-label">Date *</label><input class="form-control" id="r-date" type="date" value="${new Date().toISOString().slice(0, 10)}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Time</label><input class="form-control" id="r-time" type="time"></div>
        <div class="form-group"><label class="form-label">Colour</label><input class="form-control" id="r-color" placeholder="e.g. Black, Blue"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Brand</label><input class="form-control" id="r-brand" placeholder="e.g. Nike, Apple"></div>
        <div class="form-group"><label class="form-label">Tags (comma separated)</label><input class="form-control" id="r-tags" placeholder="e.g. wallet, black, leather"></div>
      </div>
      <div class="form-group">
        <label style="display:flex;align-items:center;gap:var(--sp-2);cursor:pointer;font-size:13px;color:var(--text-secondary)">
          <input type="checkbox" id="r-private"> Private report (visible only to admins and security)
        </label>
      </div>
      <button class="btn btn-primary btn-full btn-lg" id="submit-report-btn" onclick="submitReport()">Submit &amp; Generate Ticket</button>
    </div>
    <div>
      <div class="card" style="background:var(--lilac-50);border:1px solid var(--lilac-100)">
        <h4 style="font-size:14px;font-weight:600;margin-bottom:var(--sp-4)">Tips for Better Matching</h4>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--text-secondary)">
          <li>Include brand names and colours</li>
          <li>Mention unique identifiers or contents</li>
          <li>Be specific about the location</li>
          <li>Add relevant tags for search</li>
          <li>Use private mode for sensitive items</li>
        </ul>
      </div>
    </div>
  </div>
  <div id="ticket-modal-overlay" class="modal-overlay" onclick="if(event.target===this)this.classList.remove('open')"><div class="modal" id="ticket-modal"></div></div>`;

Pages['my-reports'] = () => {
    const u = State.currentUser;
    const myItems = State.items.filter(i => i.userId === u.id);
    return `
  <div class="topbar">
    <div><h1 style="font-size:22px">My Reports</h1><p style="color:var(--text-muted);font-size:13px">Track the status of your submitted reports</p></div>
    <button class="btn btn-primary" onclick="Router.go('report')">+ New Report</button>
  </div>
  <div class="grid-4" style="margin-bottom:var(--sp-6)">
    ${[['All', myItems.length, 'var(--lilac-50)'], ['Open', myItems.filter(i => i.status === 'open').length, 'var(--sand-50)'], ['Matched', myItems.filter(i => i.status === 'matched').length, 'var(--sage-50)'], ['Closed', myItems.filter(i => i.status === 'closed').length, 'var(--gray-50)']].map(([l, v, bg]) => `
    <div class="card card-sm" style="background:${bg}"><div style="font-size:22px;font-weight:700">${v}</div><div style="font-size:11px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.05em">${l}</div></div>`).join('')}
  </div>
  <div>
    ${myItems.length ? myItems.sort((a, b) => b.created - a.created).map(it => {
        const claimCount = State.claims.filter(c => c.itemId === it.id).length;
        return `<div class="card card-sm" style="margin-bottom:var(--sp-3);display:flex;align-items:center;gap:var(--sp-5);flex-wrap:wrap">
        <div style="width:48px;height:48px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0" class="${thumbClass(it.category, it.private)}">${it.category.slice(0, 3).toUpperCase()}</div>
        <div style="flex:1;min-width:180px">
          <div style="display:flex;gap:6px;margin-bottom:4px;flex-wrap:wrap">
            <span class="badge ${it.type === 'lost' ? 'badge-rose' : 'badge-sage'}">${it.type}</span>
            <span class="badge ${it.status === 'open' ? 'status-open' : it.status === 'matched' ? 'status-matched' : 'status-closed'}">${it.status}</span>
            ${it.private ? '<span class="badge badge-gray">Private</span>' : ''}
            ${it.escalated ? '<span class="badge status-escalated">Escalated</span>' : ''}
          </div>
          <div style="font-weight:700;font-size:15px">${escHtml(it.title)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${escHtml(it.location)} &middot; ${it.date} &middot; ${it.ticketId}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          ${claimCount ? `<span class="badge badge-sand">${claimCount} claim(s)</span>` : ''}
          <div style="display:flex;gap:var(--sp-2)">
            <button class="btn btn-ghost btn-sm" onclick="openItemDetail('${it.id}')">View</button>
            ${it.status === 'open' ? `<button class="btn btn-success-soft btn-sm" onclick="markClosed('${it.id}')">Close</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('') : `<div class="empty-state"><h3>No reports yet</h3><p><a href="#" onclick="Router.go('report')" style="color:var(--lilac-500);font-weight:600">Submit your first report</a></p></div>`}
  </div>
  <div id="item-modal-overlay" class="modal-overlay" onclick="closeItemModal(event)"><div class="modal" id="item-modal"></div></div>`;
};

window._reportType = 'lost';
function selectType(type) {
    window._reportType = type;
    const l = document.getElementById('rtype-lost-card'), f = document.getElementById('rtype-found-card');
    if (type === 'lost') {
        l.style.cssText = 'text-align:center;border:2px solid var(--rose-300);background:var(--rose-50);transition:all .2s';
        f.style.cssText = 'text-align:center;border:2px solid var(--border);background:white;transition:all .2s';
    } else {
        f.style.cssText = 'text-align:center;border:2px solid var(--sage-300);background:var(--sage-50);transition:all .2s';
        l.style.cssText = 'text-align:center;border:2px solid var(--border);background:white;transition:all .2s';
    }
}

async function submitReport() {
    const title = document.getElementById('r-title')?.value.trim();
    const cat = document.getElementById('r-cat')?.value;
    const desc = document.getElementById('r-desc')?.value.trim();
    const loc = document.getElementById('r-loc')?.value.trim();
    const date = document.getElementById('r-date')?.value;
    const alertEl = document.getElementById('report-alert');
    const btn = document.getElementById('submit-report-btn');
    
    if (!title || !desc || !loc || !date) { alertEl.innerHTML = '<div class="alert alert-error">Please fill all required fields.</div>'; return; }
    
    const time = document.getElementById('r-time')?.value;
    const color = document.getElementById('r-color')?.value.trim();
    const brand = document.getElementById('r-brand')?.value.trim();
    const tagsRaw = document.getElementById('r-tags')?.value || '';
    const isPrivate = document.getElementById('r-private')?.checked;
    const tags = [...new Set([...tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean), ...title.toLowerCase().split(' '), ...(cat ? [cat.toLowerCase()] : []), ...(color ? [color.toLowerCase()] : []), ...(brand ? [brand.toLowerCase()] : [])])];
    
    try {
        btn.disabled = true; btn.textContent = 'Submitting...';
        const item = await API.post('/api/items', {
            type: window._reportType || 'lost',
            title, category: cat, desc, location: loc, date, 
            time, color, brand, private: isPrivate, tags
        });
        
        // Show success ticket modal
        const modal = document.getElementById('ticket-modal');
        const overlay = document.getElementById('ticket-modal-overlay');
        modal.innerHTML = `
        <div class="modal-header"><div class="modal-title">Ticket Generated</div>
          <button class="modal-close" onclick="document.getElementById('ticket-modal-overlay').classList.remove('open');Router.go('my-reports')">&#x2715;</button>
        </div>
        <div class="ticket" style="margin-bottom:var(--sp-5)">
          <div class="ticket-label">Ticket ID</div>
          <div class="ticket-id">${item.ticketId}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-top:var(--sp-4)">
            <div><div class="ticket-label">Type</div><div class="ticket-detail">${item.type.toUpperCase()}</div></div>
            <div><div class="ticket-label">Status</div><div class="ticket-detail">OPEN</div></div>
            <div><div class="ticket-label">Item</div><div class="ticket-detail">${escHtml(item.title)}</div></div>
            <div><div class="ticket-label">Category</div><div class="ticket-detail">${item.category}</div></div>
            <div><div class="ticket-label">Location</div><div class="ticket-detail">${escHtml(item.location)}</div></div>
            <div><div class="ticket-label">Date</div><div class="ticket-detail">${item.date}</div></div>
          </div>
        </div>
        <div class="alert alert-success">Your report has been submitted. Track it in My Reports.</div>
        <div style="display:flex;gap:var(--sp-3)">
          <button class="btn btn-primary" onclick="document.getElementById('ticket-modal-overlay').classList.remove('open');Router.go('my-reports')">My Reports</button>
          <button class="btn btn-ghost" onclick="document.getElementById('ticket-modal-overlay').classList.remove('open');Router.go('matches')">Check Matches</button>
        </div>`;
        overlay.classList.add('open');
    } catch (err) {
        alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
        btn.disabled = false; btn.textContent = 'Submit & Generate Ticket';
    }
}

Binders.report = () => { selectType('lost'); };
Binders['my-reports'] = () => { };
