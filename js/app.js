// ============ CONFIG ============
const GATEWAY = 'http://157.230.250.64:8080';
const SOAP_URL = 'https://soap-auth-service-87mrv.ondigitalocean.app/ws';

// ============ AUTH HELPERS ============
function getToken()    { return localStorage.getItem('soa_token') || ''; }
function getUser()     { return localStorage.getItem('soa_user') || ''; }
function getRole()     { return localStorage.getItem('soa_role') || ''; }

function saveAuth(token, user, role) {
  localStorage.setItem('soa_token', token);
  localStorage.setItem('soa_user', user);
  localStorage.setItem('soa_role', role);
}

function clearAuth() {
  localStorage.removeItem('soa_token');
  localStorage.removeItem('soa_user');
  localStorage.removeItem('soa_role');
}

function logout() {
  clearAuth();
  window.location.href = 'login.html';
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// ============ HEADER ============
function renderHeader(activePage) {
  const user = getUser();
  const role = getRole();
  const isLoggedIn = !!user;

  document.getElementById('header').innerHTML = `
    <a href="index.html" class="logo">SOA<span>Shop</span></a>
    <nav>
      <a href="index.html"      ${activePage==='home'?'class="active"':''}>🏠 Home</a>
      <a href="products.html"   ${activePage==='products'?'class="active"':''}>📦 Products</a>
      <a href="add-product.html"${activePage==='add-product'?'class="active"':''}>➕ Add Product</a>
      <a href="orders.html"     ${activePage==='orders'?'class="active"':''}>🛒 Orders</a>
      <a href="files.html"      ${activePage==='files'?'class="active"':''}>🖼️ Upload</a>
    </nav>
    <div class="user-badge">
      ${isLoggedIn
        ? `<span>${user}</span><span class="role-tag">${role}</span><button class="btn-logout" onclick="logout()">Logout</button>`
        : `<a href="login.html" style="color:var(--accent);text-decoration:none;font-size:0.85rem">Login</a>`
      }
    </div>
  `;
}

// ============ ALERT ============
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = msg;
  setTimeout(() => el.classList.remove('show'), 6000);
}

// ============ SOAP ============
async function soapCall(body) {
  const xml = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:auth="http://ecommerce.com/auth">
    <soapenv:Header/>
    <soapenv:Body>${body}</soapenv:Body>
  </soapenv:Envelope>`;

  const res = await fetch(SOAP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', 'SOAPAction': '' },
    body: xml
  });
  return await res.text();
}

function extractXml(xml, tag) {
  const patterns = [`<${tag}>`, `<ns2:${tag}>`, `<ns3:${tag}>`];
  for (const open of patterns) {
    const start = xml.indexOf(open);
    if (start !== -1) {
      const end = xml.indexOf('<', start + open.length);
      if (end !== -1) return xml.substring(start + open.length, end);
    }
  }
  return null;
}

// ============ REST ============
async function apiGet(path) {
  const res = await fetch(`${GATEWAY}${path}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  const cache = res.headers.get('X-Cache');
  const data = await res.json();
  return { data, cache, status: res.status };
}

async function apiPost(path, body) {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { data, status: res.status, ok: res.ok };
}
