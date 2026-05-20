// DigitalOcean-д deploy хийсэн gateway-ийн URL
const GATEWAY = 'https://api-gateway-ot9qp.ondigitalocean.app';

// Auth helpers
function getToken()    { return localStorage.getItem('token'); }
function getUser()     { return localStorage.getItem('username'); }
function getRole()     { return localStorage.getItem('role'); }
function saveAuth(token, username, role) {
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
  localStorage.setItem('role', role);
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  window.location.href = 'login.html';
}
function requireAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

// Nav render
function renderHeader(active) {
  const token = getToken();
  const links = [
    { href: 'index.html',    id: 'home',     label: 'Home' },
    { href: 'products.html', id: 'products', label: 'Products' },
    { href: 'orders.html',   id: 'orders',   label: 'Orders' },
  ];
  const navLinks = links.map(l =>
    `<a href="${l.href}" class="nav-link${active === l.id ? ' active' : ''}">${l.label}</a>`
  ).join('');
  const right = token
    ? `<span class="nav-user">${getUser()}</span><span class="nav-role">${getRole()}</span>
       <button class="btn btn-outline btn-sm" onclick="logout()">Logout</button>`
    : `<a href="login.html"   class="btn btn-outline btn-sm" style="margin-top:0">Login</a>
       <a href="register.html" class="btn btn-primary btn-sm" style="margin-top:0">Register</a>`;
  document.getElementById('header').innerHTML = `
    <nav>
      <a href="index.html" class="nav-logo">SOAShop</a>
      <div class="nav-links">${navLinks}</div>
      <div class="nav-right">${right}</div>
    </nav>`;
}

// REST helpers
async function apiGet(path) {
  const res = await fetch(GATEWAY + path, {
    headers: getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {}
  });
  const data = await res.json().catch(() => ({}));
  const cache = res.headers.get('X-Cache') || res.headers.get('x-cache') || '';
  return { data, status: res.status, ok: res.ok, cache };
}
async function apiPost(path, body) {
  const res = await fetch(GATEWAY + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { 'Authorization': `Bearer ${getToken()}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { data, status: res.status, ok: res.ok };
}

// SOAP helper — gateway /api/auth → soap-auth-service /ws
// Content-Type: text/xml байх ёстой тул copyHeaders дахь application/json-ийг override хийнэ
async function soapCall(body) {
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:auth="http://ecommerce.com/auth">
  <soapenv:Header/>
  <soapenv:Body>
    ${body}
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await fetch(`${GATEWAY}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    body: envelope
  });

  if (!res.ok && res.status !== 200) {
    const txt = await res.text().catch(() => '');
    throw new Error(`SOAP ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.text();
}

function extractXml(xml, tag) {
  // <auth:success>, <ns2:success>, <success> бүгдийг барина
  const m = xml.match(new RegExp(`<[^>]*:?${tag}[^>]*>([^<]*)<`));
  return m ? m[1].trim() : '';
}

// Alert
function showAlert(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert ${type} show`;
  if (type === 'success') setTimeout(() => el.classList.remove('show'), 4000);
}