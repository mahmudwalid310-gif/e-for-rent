// ── API Base & Auth Helpers ──────────────────────────────
const API = '/api';

function getToken() { return localStorage.getItem('token'); }
function getUser()  { return JSON.parse(localStorage.getItem('user') || 'null'); }
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, { headers: authHeaders(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── UI Helpers ───────────────────────────────────────────
function toggleModal(id) { document.getElementById(id)?.classList.toggle('hidden'); }
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl text-white font-semibold shadow-lg transition-all ${type === 'error' ? 'bg-red-500' : 'bg-green-500'}`;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

function updateNavUI() {
  const user = getUser();
  const loginBtn   = document.getElementById('login-btn');
  const userMenu   = document.getElementById('user-menu');
  const userNameEl = document.getElementById('user-name');
  const adminLink  = document.getElementById('admin-link');

  if (user) {
    loginBtn?.classList.add('hidden');
    userMenu?.classList.remove('hidden');
    if (userNameEl) userNameEl.textContent = user.name;
    if (adminLink && user.role === 'admin') adminLink.classList.remove('hidden');
  } else {
    loginBtn?.classList.remove('hidden');
    userMenu?.classList.add('hidden');
  }
}

function logout() {
  clearAuth();
  showToast('লগআউট সফল হয়েছে');
  updateNavUI();
  setTimeout(() => window.location.href = 'index.html', 800);
}

// ── Auth: Login ───────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'লগইন হচ্ছে...';
  try {
    const data = await apiFetch(`${API}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email:    document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
      })
    });
    saveAuth(data.token, data.user);
    toggleModal('login-modal');
    updateNavUI();
    showToast(`স্বাগতম, ${data.user.name}!`);
    if (data.user.role === 'admin') setTimeout(() => window.location.href = 'admin.html', 1000);
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Sign In'; }
}

// ── Auth: Register ────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'রেজিস্ট্রেশন হচ্ছে...';
  try {
    const data = await apiFetch(`${API}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name:     document.getElementById('reg-name').value,
        email:    document.getElementById('reg-email').value,
        phone:    document.getElementById('reg-phone').value,
        password: document.getElementById('reg-password').value,
        role:     document.getElementById('reg-role')?.value || 'user'
      })
    });
    saveAuth(data.token, data.user);
    toggleModal('register-modal');
    updateNavUI();
    showToast(`রেজিস্ট্রেশন সফল! স্বাগতম ${data.user.name}`);
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'রেজিস্টার করুন'; }
}

// ── Properties: Badge Color ──────────────────────────────
function badgeColor(cat) {
  if (cat.includes('Female')) return 'bg-purple-100 text-purple-800';
  if (cat.includes('Male'))   return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

// ── Properties: Render Cards ──────────────────────────────
function renderProperties(items) {
  const container = document.getElementById('listings-container');
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="col-span-3 text-center py-16 text-gray-400"><p class="text-4xl mb-3">🏠</p><p>কোনো বিজ্ঞাপন পাওয়া যায়নি।</p></div>`;
    return;
  }
  container.innerHTML = items.map(p => `
    <div class="property-card bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
      <a href="details.html?id=${p._id}">
        <img src="${p.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&q=80'}"
             class="w-full h-48 object-cover" alt="${p.title}" loading="lazy">
      </a>
      <div class="p-4">
        <span class="text-xs font-semibold px-2.5 py-0.5 rounded ${badgeColor(p.category)}">${p.category}</span>
        <h3 class="font-bold text-gray-800 mt-2 text-sm leading-snug">
          <a href="details.html?id=${p._id}" class="hover:text-blue-600">${p.title}</a>
        </h3>
        <p class="text-gray-500 text-xs mt-1">📍 ${p.address}</p>
        <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <span class="text-blue-600 font-bold">${Number(p.price).toLocaleString()} ৳/মাস</span>
          <a href="details.html?id=${p._id}" class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded font-medium hover:bg-blue-600 hover:text-white transition">Details</a>
        </div>
      </div>
    </div>`).join('');
}

// ── Properties: Fetch & Filter ────────────────────────────
async function filterProperties() {
  const search   = document.getElementById('search-input')?.value || '';
  const category = document.getElementById('category-filter')?.value || 'all';
  const price    = document.getElementById('price-filter')?.value || 'all';

  const params = new URLSearchParams();
  if (search && search !== 'all') params.set('search', search);
  if (category !== 'all') params.set('category', category);
  if (price !== 'all') {
    const [min, max] = price.split('-');
    if (min) params.set('minPrice', min);
    if (max && max !== '999999') params.set('maxPrice', max);
  }

  try {
    const data = await apiFetch(`${API}/properties?${params}`);
    renderProperties(data.properties);
  } catch { renderProperties([]); }
}

// ── Properties: Load Details Page ────────────────────────
async function loadPropertyDetails() {
  const id = new URLSearchParams(window.location.search).get('id');
  const container = document.getElementById('details-container');
  if (!container || !id) return;
  try {
    const { property: p } = await apiFetch(`${API}/properties/${id}`);
    document.title = `E-FOR-RENT - ${p.title}`;
    const mapsKey = window.GOOGLE_MAPS_KEY || '';
    const mapSrc  = p.location?.lat
      ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${p.location.lat},${p.location.lng}`
      : `https://www.google.com/maps/embed/v1/search?key=${mapsKey}&q=${encodeURIComponent(p.address + ', Bangladesh')}`;

    container.innerHTML = `
      <div class="mb-6">
        <span class="text-sm font-semibold px-3 py-1 rounded-full ${badgeColor(p.category)}">${p.category}</span>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mt-2">${p.title}</h1>
        <p class="text-gray-500 mt-1">📍 ${p.address}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="md:col-span-2">
          <img src="${p.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'}"
               class="w-full h-[350px] object-cover rounded-xl shadow-sm" alt="${p.title}">
        </div>
        <div class="grid grid-rows-2 gap-4">
          <img src="${p.images?.[1] || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80'}"
               class="w-full h-full object-cover rounded-xl shadow-sm" alt="Interior">
          <img src="${p.images?.[2] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&q=80'}"
               class="w-full h-full object-cover rounded-xl shadow-sm" alt="Bathroom">
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm text-center">
            <div class="border-r border-gray-100"><p class="text-gray-400 text-xs uppercase">ভাড়া/মাস</p><p class="text-xl font-bold text-blue-600">${Number(p.price).toLocaleString()} ৳</p></div>
            <div class="border-r border-gray-100"><p class="text-gray-400 text-xs uppercase">অগ্রিম</p><p class="text-xl font-bold text-gray-800">${p.advance}</p></div>
            <div class="border-r border-gray-100"><p class="text-gray-400 text-xs uppercase">বেডরুম</p><p class="text-xl font-bold text-gray-800">${p.bedrooms}</p></div>
            <div><p class="text-gray-400 text-xs uppercase">বাথরুম</p><p class="text-xl font-bold text-gray-800">${p.bathrooms}</p></div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm">
            <h2 class="text-lg font-bold text-gray-800 mb-3">বাসার বিবরণ</h2>
            <p class="text-gray-600 text-sm leading-relaxed">${p.description}</p>
          </div>
          ${p.amenities?.length ? `<div class="bg-white p-6 rounded-xl shadow-sm">
            <h2 class="text-lg font-bold text-gray-800 mb-4">সুবিধা সমূহ</h2>
            <div class="flex flex-wrap gap-3">${p.amenities.map(a => `<span class="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">${a}</span>`).join('')}</div>
          </div>` : ''}
          <div class="bg-white p-6 rounded-xl shadow-sm">
            <h2 class="text-lg font-bold text-gray-800 mb-4">📍 মানচিত্রে দেখুন</h2>
            <iframe src="${mapSrc}" width="100%" height="220" style="border:0;border-radius:12px;" allowfullscreen loading="lazy"></iframe>
          </div>
        </div>
        <div class="space-y-6">
          <div class="bg-white p-6 rounded-xl shadow-md border border-gray-100 sticky top-24">
            <h3 class="font-bold text-gray-800 mb-4 text-center border-b pb-2">💳 মাসিক বিল ও পেমেন্ট</h3>
            <div class="space-y-3" id="bills-section">
              ${['rent','current','wifi','gas'].map(k => p.bills?.[k] ? renderBillRow(k, p.bills[k], p._id) : '').join('')}
            </div>
            <hr class="my-4 border-gray-100">
            <a href="tel:+880${p.phone}" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold block text-center hover:bg-blue-700 transition mb-2">📞 কল করুন</a>
            <a href="https://wa.me/880${p.phone}" target="_blank" class="w-full bg-green-500 text-white py-3 rounded-lg font-semibold block text-center hover:bg-green-600 transition">💬 WhatsApp</a>
          </div>
        </div>
      </div>`;
  } catch (err) {
    container.innerHTML = `<div class="text-center py-20"><p class="text-5xl mb-4">😕</p><p class="text-xl font-semibold text-gray-600">${err.message}</p><a href="index.html" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg">হোমে ফিরুন</a></div>`;
  }
}

function renderBillRow(key, bill, propertyId) {
  const paid = bill.status === 'Paid';
  return `<div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border">
    <div>
      <p class="font-bold text-gray-700 text-sm">${bill.name}</p>
      <p class="text-xs font-semibold ${paid ? 'text-green-600' : 'text-red-500'}">${Number(bill.amount).toLocaleString()} ৳ — ${paid ? 'পরিশোধিত' : 'বকেয়া'}</p>
    </div>
    ${paid ? `<span class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold">✓ Paid</span>`
           : `<button onclick="openPaymentModal('${key}',${bill.amount},'${bill.name}','${propertyId}')"
                      class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700">Pay Now</button>`}
  </div>`;
}

// ── Payment Modal ─────────────────────────────────────────
let _pay = {};
function openPaymentModal(type, amount, name, propertyId) {
  _pay = { type, amount, name, propertyId };
  document.getElementById('modal-bill-title').textContent  = name;
  document.getElementById('modal-bill-amount').textContent = Number(amount).toLocaleString() + ' ৳';
  document.getElementById('payment-modal')?.classList.remove('hidden');
  selectProvider('bkash');
}
function closePaymentModal() {
  document.getElementById('payment-modal')?.classList.add('hidden');
  document.getElementById('payment-form')?.reset();
}
function selectProvider(p) {
  _pay.provider = p;
  const header = document.getElementById('modal-header');
  const payBtn = document.getElementById('modal-pay-btn');
  const bkBtn  = document.getElementById('btn-bkash');
  const ngBtn  = document.getElementById('btn-nagad');
  if (p === 'bkash') {
    header.className = 'bg-pink-600 text-white p-4 text-center font-bold text-lg relative';
    payBtn.className = 'w-full bg-pink-600 text-white py-3.5 rounded-xl font-bold hover:bg-pink-700 shadow-md';
    bkBtn.className  = 'flex-1 py-2 rounded-lg font-bold text-sm bg-pink-600 text-white';
    ngBtn.className  = 'flex-1 py-2 rounded-lg font-bold text-sm bg-gray-100 text-gray-700';
    document.getElementById('provider-name').textContent = 'bKash';
  } else {
    header.className = 'bg-orange-500 text-white p-4 text-center font-bold text-lg relative';
    payBtn.className = 'w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 shadow-md';
    bkBtn.className  = 'flex-1 py-2 rounded-lg font-bold text-sm bg-gray-100 text-gray-700';
    ngBtn.className  = 'flex-1 py-2 rounded-lg font-bold text-sm bg-orange-500 text-white';
    document.getElementById('provider-name').textContent = 'Nagad';
  }
}

async function processPayment(e) {
  e.preventDefault();
  const phone = document.getElementById('payer-phone').value;
  const btn   = document.getElementById('modal-pay-btn');
  btn.disabled = true; btn.textContent = 'প্রসেস হচ্ছে...';
  try {
    const data = await apiFetch(`${API}/payments`, {
      method: 'POST',
      body: JSON.stringify({ propertyId: _pay.propertyId, billType: _pay.type, payerPhone: phone, provider: _pay.provider })
    });
    closePaymentModal();
    showToast(`✅ ${_pay.name} পরিশোধ সফল!`);
    setTimeout(() => window.location.href = `receipt.html?id=${data.payment.receiptId}`, 1200);
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = 'কনফার্ম পেমেন্ট'; }
}

// ── Add Property ──────────────────────────────────────────
async function saveProperty(e) {
  e.preventDefault();
  if (!getToken()) { showToast('বিজ্ঞাপন দিতে লগইন করুন', 'error'); toggleModal('login-modal'); return; }
  const form = e.target;
  const btn  = form.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'পোস্ট হচ্ছে...';
  try {
    const fd = new FormData(form);
    const amenities = [];
    form.querySelectorAll('input[type=checkbox]:checked').forEach(cb => amenities.push(cb.value));
    fd.set('amenities', JSON.stringify(amenities));
    const res = await fetch(`${API}/properties`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed');
    showToast('✅ বিজ্ঞাপন পোস্ট হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে দেখা যাবে।');
    setTimeout(() => window.location.href = 'index.html', 1800);
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; btn.textContent = '🚀 বিজ্ঞাপনটি পোস্ট করুন'; }
}

// ── Mobile Menu ───────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
  document.getElementById('hamburger-btn')?.classList.toggle('open');
}