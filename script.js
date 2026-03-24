/* ============================================================
   St. Mary's Dental Clinic — script.js
   Features:
   1. Clinic photo lightbox
   2. Smooth scroll for anchor links
   3. User authentication (register / login / logout)
   4. Appointment booking via Calendly (with name/email prefill)
   ============================================================ */

var CALENDLY_URL = 'https://calendly.com/stmaryshospital';


/* ---- 1. PHOTO LIGHTBOX ---- */
(function () {
  var lightbox = document.getElementById('lightbox');
  var lbImg    = document.getElementById('lbImg');
  var lbClose  = document.getElementById('lbClose');

  document.querySelectorAll('.gallery-item').forEach(function (item) {
    item.addEventListener('click', function () {
      var img = item.querySelector('img');
      lbImg.src = img.src.replace('w=500', 'w=900');
      lbImg.alt = img.alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }
})();


/* ---- 2. SMOOTH SCROLL ---- */
(function () {
  var HEADER_H = 70;
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - HEADER_H, behavior: 'smooth' });
    });
  });
})();


/* ============================================================
   3. AUTHENTICATION — localStorage-based
   Users:   smdc_users   → { email: { name, phone, passwordHash } }
   Session: smdc_session → email string
   ============================================================ */

function simpleHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return h.toString(16);
}

function getUsers()        { return JSON.parse(localStorage.getItem('smdc_users') || '{}'); }
function saveUsers(u)      { localStorage.setItem('smdc_users', JSON.stringify(u)); }
function getSession()      { return localStorage.getItem('smdc_session') || null; }
function setSession(email) { localStorage.setItem('smdc_session', email); }
function clearSession()    { localStorage.removeItem('smdc_session'); }

function getCurrentUser() {
  var email = getSession();
  if (!email) return null;
  var u = getUsers()[email];
  return u ? Object.assign({ email: email }, u) : null;
}

function refreshAuthUI() {
  var user = getCurrentUser();
  document.getElementById('authArea').style.display  = user ? 'none'  : 'block';
  document.getElementById('userArea').style.display  = user ? 'flex'  : 'none';
  if (user) document.getElementById('userGreet').textContent = 'Hi, ' + user.name.split(' ')[0];
}

function doRegister() {
  clearFormError('registerError');
  var name  = document.getElementById('regName').value.trim();
  var phone = document.getElementById('regPhone').value.trim();
  var email = document.getElementById('regEmail').value.trim().toLowerCase();
  var pass  = document.getElementById('regPassword').value;

  if (!name)                     return showFormError('registerError', 'Please enter your full name.');
  if (!phone)                    return showFormError('registerError', 'Please enter your phone number.');
  if (!email || !email.includes('@')) return showFormError('registerError', 'Please enter a valid email address.');
  if (pass.length < 6)           return showFormError('registerError', 'Password must be at least 6 characters.');

  var users = getUsers();
  if (users[email]) return showFormError('registerError', 'An account with this email already exists. Please login.');

  users[email] = { name: name, phone: phone, passwordHash: simpleHash(pass) };
  saveUsers(users);
  setSession(email);
  refreshAuthUI();
  closeAllModals();
  showToast('Account created! Welcome, ' + name.split(' ')[0] + ' 👋');
  checkPendingCalendly();
}

function doLogin() {
  clearFormError('loginError');
  var email = document.getElementById('loginEmail').value.trim().toLowerCase();
  var pass  = document.getElementById('loginPassword').value;

  if (!email || !email.includes('@')) return showFormError('loginError', 'Please enter a valid email address.');
  if (!pass)                          return showFormError('loginError', 'Please enter your password.');

  var users = getUsers();
  var user  = users[email];
  if (!user || user.passwordHash !== simpleHash(pass))
    return showFormError('loginError', 'Incorrect email or password. Please try again.');

  setSession(email);
  refreshAuthUI();
  closeAllModals();
  showToast('Welcome back, ' + user.name.split(' ')[0] + '! 👋');
  checkPendingCalendly();
}

function logout() {
  clearSession();
  refreshAuthUI();
  showToast('You have been logged out.');
}

/* After login/register, open Calendly if that was the intent */
function checkPendingCalendly() {
  if (window._pendingCalendly) {
    window._pendingCalendly = false;
    setTimeout(openCalendlyModal, 150);
  }
}


/* ============================================================
   4. CALENDLY INTEGRATION
   Opens the appointment modal and renders the Calendly inline
   widget, pre-filled with the logged-in user's name & email.
   ============================================================ */

function requireAuthThen() {
  if (getCurrentUser()) {
    openCalendlyModal();
  } else {
    window._pendingCalendly = true;
    openModal('loginModal');
  }
}

function openCalendlyModal() {
  var user = getCurrentUser();
  if (!user) return;

  // Show the modal
  document.getElementById('modalOverlay').classList.add('open');
  document.querySelectorAll('.modal').forEach(function (m) { m.style.display = 'none'; });
  var modal = document.getElementById('appointmentModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Label
  document.getElementById('apptSub').textContent = 'Booking for: ' + user.name + ' (' + user.email + ')';

  // Build Calendly URL with prefill query params
  var params = new URLSearchParams({
    name:  user.name,
    email: user.email,
    hide_gdpr_banner: '1'
  });
  var embedURL = CALENDLY_URL + '?' + params.toString();

  var container = document.getElementById('calendlyContainer');
  container.innerHTML = '';

  // Compute explicit pixel height: modal height minus header elements
  function getContainerHeight() {
    var modalH  = modal.getBoundingClientRect().height;
    var closeH  = (modal.querySelector('.modal-close').offsetHeight || 32) + 14;
    var titleH  = (document.getElementById('apptTitle').offsetHeight || 30);
    var subH    = (document.getElementById('apptSub').offsetHeight || 20);
    var padding = 64; // top + bottom padding + gaps
    return Math.max(500, modalH - closeH - titleH - subH - padding);
  }

  function applyHeight(h) {
    container.style.height    = h + 'px';
    container.style.minHeight = h + 'px';
    // Also force any Calendly-injected wrapper and iframe
    var inner  = container.firstElementChild;
    var iframe = container.querySelector('iframe');
    if (inner)  { inner.style.height  = h + 'px'; inner.style.minHeight  = h + 'px'; }
    if (iframe) { iframe.style.height = h + 'px'; iframe.style.minHeight = h + 'px'; }
  }

  function renderWidget() {
    var h = getContainerHeight();
    container.style.height    = h + 'px';
    container.style.minHeight = h + 'px';

    if (window.Calendly && window.Calendly.initInlineWidget) {
      window.Calendly.initInlineWidget({
        url: embedURL,
        parentElement: container,
        prefill: { name: user.name, email: user.email }
      });
      // Give Calendly time to inject its wrapper + iframe, then force heights
      setTimeout(function () { applyHeight(getContainerHeight()); }, 500);
      setTimeout(function () { applyHeight(getContainerHeight()); }, 1500);
    } else {
      // Fallback: plain iframe
      var iframe = document.createElement('iframe');
      iframe.src = embedURL;
      iframe.style.cssText = 'width:100%;height:' + h + 'px;min-height:' + h + 'px;border:none;display:block;';
      iframe.title = 'Book an appointment';
      container.appendChild(iframe);
    }
  }

  // Small delay so modal has painted and has real dimensions
  setTimeout(renderWidget, window.Calendly ? 60 : 900);
}


/* ============================================================
   MODAL HELPERS
   ============================================================ */

function openModal(id) {
  document.getElementById('modalOverlay').classList.add('open');
  document.querySelectorAll('.modal').forEach(function (m) { m.style.display = 'none'; });
  document.getElementById(id).style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeAllModals() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(function (m) { m.style.display = 'none'; });
  document.body.style.overflow = '';
  // Clear the Calendly widget so it re-initialises fresh next time
  var c = document.getElementById('calendlyContainer');
  if (c) c.innerHTML = '';
}

function switchModal(from, to) {
  document.getElementById(from).style.display = 'none';
  document.getElementById(to).style.display = 'block';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeAllModals();
}


/* ============================================================
   FORM HELPERS
   ============================================================ */
function showFormError(id, msg) {
  var el = document.getElementById(id);
  el.style.display = 'block';
  el.textContent = msg;
}
function clearFormError(id) {
  var el = document.getElementById(id);
  el.style.display = 'none';
  el.textContent = '';
}


/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function showToast(msg) {
  var old = document.getElementById('smdcToast');
  if (old) old.remove();
  var t = document.createElement('div');
  t.id = 'smdcToast';
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(function () { t.classList.add('toast-in'); });
  setTimeout(function () {
    t.classList.remove('toast-in');
    setTimeout(function () { t.remove(); }, 400);
  }, 3200);
}


/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  refreshAuthUI();
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllModals();
  });
});
