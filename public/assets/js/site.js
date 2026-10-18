// CPM Rent Dubai: navigation, cart, product page calculator, order request.
(function () {
  'use strict';
  var P = window.CpmPricing;
  var KEY = 'cpmd_cart_v1';
  var WA = '385923238233'; // O2: replace with the UAE number when decided (also in src/site.mjs)

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // ---------- storage (private mode or blocked storage must not break the page)
  function readCart() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function writeCart(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* cart lives for this page only */ }
    memo = lines;
    updateCount();
  }
  var memo = null;
  function cartLines() { return memo || (memo = readCart()); }

  function updateCount() {
    var n = cartLines().reduce(function (s, l) { return s + (l.qty || 1); }, 0);
    $$('[data-cart-count]').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
  }

  function track(name, props) {
    try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props || {}); } catch (e) { /* ignore */ }
  }

  // ---------- dates
  function iso(d) { return d.toISOString().slice(0, 10); }
  function addDays(s, n) { var d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function today() { var d = new Date(); return iso(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))); }
  function nice(s) {
    var d = new Date(s + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  // ---------- nav
  function initNav() {
    var burger = $('#burger'); var nav = $('#nav');
    if (!burger || !nav) return;
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-lock', open);
    });
    $$('.cities', nav).forEach(function (grp) {
      var t = document.createElement('button');
      t.type = 'button'; t.className = 'submenu-toggle'; t.setAttribute('aria-label', 'Open submenu');
      t.addEventListener('click', function () { grp.classList.toggle('open'); });
      grp.appendChild(t);
    });
  }

  // ---------- bottom bar: visible once the hero buttons scroll away (or always on pages without them)
  function initBar() {
    var bar = $('.mob-traka'); if (!bar) return;
    var cta = $('.hero-cta');
    if (!cta || !('IntersectionObserver' in window)) { bar.classList.add('vidljiva'); return; }
    new IntersectionObserver(function (es) { bar.classList.toggle('vidljiva', !es[0].isIntersecting); }).observe(cta);
  }

  // ---------- product page
  function initProduct() {
    var box = $('[data-buybox]'); if (!box || !P) return;
    var data = JSON.parse($('[data-product]', box).textContent);
    var total = $('[data-total]', box), detail = $('[data-detail]', box), wa = $('[data-wa]', box), added = $('[data-added]', box);
    var variantSel = $('#variant', box), from = $('#from', box), to = $('#to', box), qty = $('#qty', box);

    function variant() {
      if (data.mode !== 'rent') return null;
      var id = variantSel ? variantSel.value : data.variants[0].id;
      return data.variants.filter(function (v) { return v.id === id; })[0] || data.variants[0];
    }
    function current() {
      if (data.mode === 'sale') {
        var q = Math.max(1, Math.min(10, parseInt(qty.value, 10) || 1));
        return { line: { slug: data.slug, qty: q }, total: data.price * q, text: data.name + (q > 1 ? ' x' + q : '') };
      }
      var v = variant(); var days = P.billableDays(from.value, to.value);
      if (!days) return { error: 'Choose an end date after the start date.' };
      var res = P.quote(v.periods, days);
      if (!res) return { error: 'For rentals longer than a year, message us.' };
      return {
        line: { slug: data.slug, variant: v.id, qty: 1, from: from.value, to: to.value },
        total: res.total, days: days, parts: res.parts,
        text: data.name + (data.variants.length > 1 ? ' (' + v.label + ')' : '') + ', ' + nice(from.value) + ' to ' + nice(to.value),
      };
    }
    function render() {
      var c = current();
      added.hidden = true;
      if (c.error) { total.textContent = '·'; detail.textContent = c.error; return; }
      total.textContent = P.formatAed(c.total);
      if (data.mode === 'rent') {
        detail.textContent = c.days + (c.days === 1 ? ' day' : ' days') + ' · ' + c.parts.map(function (p) {
          return (p.count > 1 ? p.count + ' x ' : '') + (p.days === 1 ? 'day rate ' : p.days + ' day rate ') + P.formatAed(p.price);
        }).join(' + ');
        var tb = $('[data-periods] tbody', box);
        if (tb) tb.innerHTML = variant().periods.map(function (p) {
          return '<tr><td>' + label(p.days) + '</td><td>' + P.formatAed(p.price) + '</td></tr>';
        }).join('');
      }
      wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello, I would like to ' + (data.mode === 'rent' ? 'rent' : 'buy') + ': ' + c.text + ' (' + P.formatAed(c.total) + ')');
    }
    if (data.mode === 'rent') {
      var t = today(); var start = addDays(t, 1);
      var shortest = Math.min.apply(null, data.variants[0].periods.map(function (p) { return p.days; }));
      from.min = t; to.min = addDays(t, 1);
      from.value = start; to.value = addDays(start, shortest === 1 ? 7 : shortest);
      from.addEventListener('change', function () {
        to.min = addDays(from.value, 1);
        if (!P.billableDays(from.value, to.value)) to.value = addDays(from.value, 7);
        render();
      });
      to.addEventListener('change', render);
      if (variantSel) variantSel.addEventListener('change', render);
      track('kalkulator_najam', { slug: data.slug });
    } else {
      qty.addEventListener('input', render);
    }
    $('[data-add]', box).addEventListener('click', function () {
      var c = current(); if (c.error) { detail.textContent = c.error; return; }
      var lines = cartLines().slice();
      lines.push(c.line);
      writeCart(lines.slice(-20));
      added.hidden = false;
      track('dodano_u_kosaricu', { slug: data.slug, mode: data.mode, total: c.total });
    });
    render();
  }

  function label(d) {
    return { 1: 'per day', 7: 'up to 1 week', 14: 'up to 2 weeks', 30: 'up to 1 month', 60: 'up to 2 months' }[d] || 'up to ' + d + ' days';
  }

  // ---------- cart page
  function initCart() {
    var wrap = $('[data-cart-lines]'); if (!wrap) return;
    var form = $('[data-order-form]'), err = $('[data-order-err]'), sumBox = $('[data-cart-total]'), sum = $('[data-cart-sum]');
    var cat = null;

    function priced() {
      return cartLines().map(function (l, i) {
        var p = cat[l.slug]; if (!p) return null;
        if (p.mode === 'sale') return { i: i, p: p, l: l, total: p.price * l.qty, meta: 'Buy · qty ' + l.qty };
        var v = p.variants.filter(function (x) { return x.id === l.variant; })[0];
        var days = P.billableDays(l.from, l.to);
        var q = v && days ? P.quote(v.periods, days) : null;
        if (!q) return null;
        return { i: i, p: p, l: l, total: q.total * l.qty, meta: 'Rent' + (p.variants.length > 1 ? ' · ' + v.label : '') + ' · ' + nice(l.from) + ' to ' + nice(l.to) + ' (' + days + (days === 1 ? ' day)' : ' days)') };
      }).filter(Boolean);
    }
    function render() {
      var rows = priced();
      if (!rows.length) {
        wrap.innerHTML = '<div class="cart-empty"><p>Your cart is empty.</p><p><a class="btn btn-primary" href="/rent">Rent equipment</a></p></div>';
        sumBox.hidden = true; return;
      }
      wrap.innerHTML = rows.map(function (r) {
        return '<div class="cart-line"><div><h3><a href="' + r.p.url + '">' + escapeHtml(r.p.name) + '</a></h3><p class="meta">' + escapeHtml(r.meta) + '</p></div>' +
          '<div class="amt">' + P.formatAed(r.total) + '</div><button class="rm" type="button" data-rm="' + r.i + '">Remove</button></div>';
      }).join('');
      sum.textContent = P.formatAed(rows.reduce(function (s, r) { return s + r.total; }, 0));
      sumBox.hidden = false;
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      var lines = cartLines().slice(); lines.splice(Number(b.getAttribute('data-rm')), 1); writeCart(lines); render();
    });

    fetch('/assets/catalog.json').then(function (r) { return r.json(); }).then(function (c) { cat = c; render(); })
      .catch(function () { wrap.innerHTML = '<div class="cart-empty"><p>Could not load the cart. Please refresh the page.</p></div>'; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
      var rows = cat ? priced() : [];
      if (!rows.length) { showErr('Your cart is empty.'); return; }
      var f = new FormData(form);
      var body = {
        name: f.get('name'), phone: f.get('phone'), emirate: f.get('emirate'), area: f.get('area'),
        address: f.get('address'), payment: f.get('payment'), note: f.get('note'), web: f.get('web'),
        page: location.pathname, lines: rows.map(function (r) { return r.l; }),
      };
      if (String(body.name || '').trim().length < 2) return invalid('o-name', 'Please enter your name.');
      var digits = String(body.phone || '').replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) return invalid('o-phone', 'Please check the mobile number.');
      if (!String(body.area || '').trim()) return invalid('o-area', 'Please enter the area for delivery.');
      var btn = $('button[type=submit]', form); btn.disabled = true;
      fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok || !res.j.ok) throw new Error(res.j.error || '');
          track('narudzba_poslana', { lines: rows.length, total: res.j.total });
          writeCart([]);
          form.innerHTML = '<p class="ok"><strong>Thank you, your order request is in.</strong> We reply on WhatsApp shortly with availability, delivery time and the delivery fee. Order total ' + P.formatAed(res.j.total) + ' plus delivery.</p>';
          render();
        })
        .catch(function (x) {
          btn.disabled = false;
          var text = rows.map(function (r) { return r.p.name + ' (' + r.meta + ')'; }).join('; ');
          showErr((x && x.message ? x.message + ' ' : 'Sending failed. ') + 'You can send the order on <a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello, I would like to order: ' + text) + '" target="_blank" rel="noopener">WhatsApp</a> instead.', true);
        });
    });
    function invalid(id, msg) { var el = document.getElementById(id); el.setAttribute('aria-invalid', 'true'); el.focus(); showErr(msg); }
    function showErr(msg, html) { if (html) err.innerHTML = msg; else err.textContent = msg; err.hidden = false; }
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // contact clicks for analytics
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="https://wa.me"], a[href^="tel:"]'); if (!a) return;
    track('kontakt_klik', { kanal: a.href.indexOf('tel:') === 0 ? 'telefon' : 'whatsapp', mjesto: a.closest('.mob-traka') ? 'traka' : a.closest('.hero') ? 'hero' : a.closest('[data-buybox]') ? 'proizvod' : 'tekst' });
  });

  updateCount();
  initNav();
  initBar();
  initProduct();
  initCart();
})();
