(function () {
  document.documentElement.classList.add('js');
  document.addEventListener('DOMContentLoaded', function () {
    var month = new Date().getMonth() + 1;
    var names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var count = 0;
    document.querySelectorAll('[data-months]').forEach(function (c) {
      var on = c.getAttribute('data-months').split(',').map(Number).indexOf(month) >= 0;
      var peak = c.getAttribute('data-peak').split(',').map(Number).indexOf(month) >= 0;
      if (on) { c.classList.add('in-season'); }
      var b = c.querySelector('.badge');
      if (b && peak) { b.hidden = false; b.textContent = 'Peak season'; } else if (b && on) { b.hidden = false; }
    });
    var sg = document.querySelector('[data-season-grid]');
    if (sg) {
      count = sg.querySelectorAll('.in-season').length;
      var label = document.querySelector('[data-season-label]');
      if (label) label.textContent = count + ' crops are being harvested in ' + names[month - 1] + ' — ready to pack for your next order.';
      if (!count) sg.removeAttribute('data-season-grid');
    }
    document.querySelectorAll('[data-m="' + month + '"]').forEach(function (e) { e.classList.add('now'); });

    var hb = document.querySelector('[data-hero-slides]');
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hb && hb.querySelector('template') && !reduce) {
      var slides = [hb.querySelector('.slide')], extra = Array.prototype.slice.call(hb.querySelector('template').content.children), cur = 0;
      var ready = function (s, done) {          // put the slide in the page, wait until its photo is decoded
        if (s.parentNode !== hb) hb.appendChild(s);    // (still inside the <template> until now)
        var im = s.querySelector('img');
        if (im.complete && im.naturalWidth) return done();
        im.addEventListener('load', done, { once: true }); im.addEventListener('error', done, { once: true });
      };
      var next = function () {
        if (document.hidden) return setTimeout(next, 7000);
        if (extra.length) slides.push(extra.shift());
        var n = (cur + 1) % slides.length, s = slides[n];
        ready(s, function () {
          slides[cur].classList.remove('on'); s.classList.add('on'); cur = n;
          setTimeout(next, 7000);
        });
      };
      var start = function () { setTimeout(next, 6000); };
      if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
    }

    var grid = document.querySelector('[data-filter-grid]');
    if (grid) {
      var kind = 'all', group = 'all', q = '';
      var groupsRow = document.querySelector('[data-groups]');
      var apply = function () {
        var shown = 0;
        grid.querySelectorAll('.card').forEach(function (c) {
          var ok = kind === 'all' || (kind === 'season' ? c.classList.contains('in-season') && c.getAttribute('data-kind') !== 'packaged' : c.getAttribute('data-kind') === kind);
          if (ok && kind === 'packaged' && group !== 'all') ok = c.getAttribute('data-group') === group;
          if (ok && q) ok = (c.getAttribute('data-search') || '').indexOf(q) >= 0;
          c.classList.toggle('hide', !ok); if (ok) shown++;
        });
        document.querySelector('[data-empty]').hidden = shown > 0;
        if (groupsRow) groupsRow.hidden = kind !== 'packaged';
      };
      var press = function (sel, btn) { document.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); }); };
      document.querySelectorAll('[data-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () { kind = btn.getAttribute('data-filter'); press('[data-filter]', btn); apply(); });
      });
      document.querySelectorAll('[data-group]').forEach(function (btn) {
        btn.addEventListener('click', function () { group = btn.getAttribute('data-group'); press('[data-group]', btn); apply(); });
      });
      var si = document.querySelector('[data-search-input]');
      if (si) si.addEventListener('input', function () { q = si.value.trim().toLowerCase(); apply(); });
      var fromHash = function () {
        var pre = document.querySelector('[data-filter="' + location.hash.slice(1).replace(/[^a-z]/g, '') + '"]');
        if (pre) pre.click();
      };
      fromHash();
      window.addEventListener('hashchange', fromHash);
    }

    var today = new Date().toISOString().slice(0, 10);
    document.querySelectorAll('.price[data-until]').forEach(function (p) {
      var u = p.getAttribute('data-until');
      if (u && u < today) { p.classList.add('expired'); p.querySelector('.price-x').hidden = false; }
    });

    var KEY = 'owEnquiry';
    var load = function () { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
    var store = function (l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) { /* private mode */ } };
    var list = load();
    var bar = document.querySelector('[data-enq]');
    var render = function () {
      document.querySelectorAll('[data-add]').forEach(function (b) {
        var on = list.some(function (x) { return x.s === b.getAttribute('data-add'); });
        b.classList.toggle('added', on);
        var t = b.querySelector('span'); if (t) t.textContent = on ? 'In your enquiry' : 'Add to enquiry';
      });
      if (!bar) return;
      bar.hidden = !list.length || !!document.querySelector('form[data-api]');
      bar.querySelector('[data-enq-count]').textContent = list.length;
      bar.querySelector('[data-enq-items]').textContent = list.map(function (x) { return x.n; }).join(', ');
      bar.querySelector('[data-enq-send]').href = '/quote/?items=' + encodeURIComponent(list.map(function (x) { return x.s; }).join(','));
      document.body.classList.toggle('has-enq', !bar.hidden);
    };
    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-add'), i = list.findIndex(function (x) { return x.s === s; });
        if (i >= 0) list.splice(i, 1); else list.push({ s: s, n: b.getAttribute('data-name') });
        store(list); render();
      });
    });
    var clr = document.querySelector('[data-enq-clear]');
    if (clr) clr.addEventListener('click', function () { list = []; store(list); render(); });
    render();

    var post = function (endpoint, body) {
      return fetch(endpoint, { method: 'POST', body: body })
        .then(function (r) { return r.json(); });
    };

    document.querySelectorAll('form[data-ask]').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = f.querySelector('.ask-ok'), bad = f.querySelector('.ask-err'), b = f.querySelector('button[type=submit]');
        var endpoint = f.getAttribute('action');
        bad.hidden = true;
        if (!endpoint) { bad.textContent = 'Please ask us on WhatsApp.'; bad.hidden = false; return; }
        b.disabled = true;
        var body = new URLSearchParams(new FormData(f)); body.set('ajax', '1');
        post(endpoint, body).then(function (d) {
          if (d.ok) { f.reset(); ok.hidden = false; } else { bad.textContent = d.error || 'Could not send. Please try WhatsApp.'; bad.hidden = false; }
        }).catch(function () { bad.textContent = 'Could not send. Please try WhatsApp.'; bad.hidden = false; })
          .then(function () { b.disabled = false; });
      });
    });

    var tf = document.querySelector('form[data-track]');
    if (tf) {
      var outBox = document.querySelector('[data-track-out]');
      var esc = function (v) { var d = document.createElement('div'); d.textContent = v == null ? '' : String(v); return d.innerHTML; };
      var fmt = function (v) { if (!v) return ''; var d = new Date(String(v).slice(0, 10) + 'T00:00:00'); return isNaN(d) ? esc(v) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
      var show = function (d) {
        if (!d.ok) { outBox.innerHTML = '<div class="track-msg">' + esc(d.error || 'Not found.') + '</div>'; return; }
        var steps = (d.stages || []).map(function (st, i) {
          var cls = i + 1 < d.stage_no ? 'done' : (i + 1 === d.stage_no ? 'now' : '');
          return '<li class="' + cls + '"><span></span>' + esc(st.replace(/^\d+\.\s*/, '')) + '</li>';
        }).join('');
        var row = function (k, v) { return v ? '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>' : ''; };
        var link = d.carrier_link && /^https:\/\//.test(d.carrier_link) ? '<a href="' + esc(d.carrier_link) + '" rel="noopener nofollow" target="_blank">Carrier tracking</a>' : '';
        outBox.innerHTML = '<div class="track-card"><p class="track-id">Order <b>' + esc(d.order) + '</b>' + (d.updated ? ' · updated ' + fmt(d.updated) : '') + '</p>' +
          '<h3>' + esc(String(d.stage || 'Order received').replace(/^\d+\.\s*/, '')) + '</h3>' +
          (d.update ? '<p class="track-note">' + esc(d.update) + '</p>' : '') +
          '<ol class="track-steps">' + steps + '</ol><dl class="track-facts">' +
          row('Products', esc(d.products)) + row('Quantity', esc(d.quantity)) + row('Terms', esc(d.basis)) + row('Destination', esc(d.destination)) +
          row('Vessel / flight', esc(d.vessel)) + row('Container / AWB', esc(d.container)) + row('B/L', esc(d.bl)) +
          row('ETD', fmt(d.etd)) + row('ETA', fmt(d.eta)) + row('Carrier', link) + '</dl></div>';
      };
      tf.addEventListener('submit', function (e) {
        e.preventDefault();
        var ep = tf.getAttribute('data-track');
        if (!ep) { show({ ok: false, error: 'Tracking is not available right now — please ask us on WhatsApp.' }); return; }
        var u = ep + '?site=export&what=track&order=' + encodeURIComponent(tf.order.value) + '&code=' + encodeURIComponent(tf.code.value);
        outBox.innerHTML = '<div class="track-msg">Looking up your shipment…</div>';
        fetch(u).then(function (r) { return r.json(); }).then(show)
          .catch(function () { show({ ok: false, error: 'Could not reach the tracking service. Please try again or ask us on WhatsApp.' }); });
      });
      var demo = document.querySelector('[data-demo]');
      if (demo) demo.addEventListener('click', function () { tf.order.value = 'DEMO-2026'; tf.code.value = '0000'; tf.requestSubmit ? tf.requestSubmit() : tf.dispatchEvent(new Event('submit')); });
    }

    var form = document.querySelector('form[data-api]');
    if (!form) return;
    var params = new URLSearchParams(location.search);
    var want = params.get('product');
    var wanted = (params.get('items') || '').split(',').concat(want ? [want] : []).concat(list.map(function (x) { return x.s; }));
    form.querySelectorAll('input[name="products"]').forEach(function (cb) { if (wanted.indexOf(cb.getAttribute('data-slug')) >= 0) cb.checked = true; });
    var sent = document.querySelector('[data-sent]'), err = document.querySelector('[data-error]');
    var errText = document.querySelector('[data-error-text]'), btn = form.querySelector('[data-submit]');
    var fallback = 'Could not send right now. Please WhatsApp us or email ' + form.getAttribute('data-fallback') + '.';
    var showError = function (m) { errText.textContent = m; err.hidden = false; sent.hidden = true; err.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    if (params.get('sent') === '1') sent.hidden = false;
    var endpoint = form.getAttribute('action');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.querySelector('input[name="products"]:checked')) { showError('Please choose at least one product.'); return; }
      if (!endpoint) { showError(fallback); return; }
      btn.disabled = true;
      var body = new URLSearchParams();
      new FormData(form).forEach(function (v, k) { body.append(k, v); });
      body.set('products', Array.prototype.map.call(form.querySelectorAll('input[name="products"]:checked'), function (c) { return c.value; }).join(', '));
      body.set('ajax', '1');
      if (body.get('need')) { body.set('message', 'Request: ' + body.get('need') + (body.get('message') ? '\n\n' + body.get('message') : '')); body.delete('need'); }
      fetch(endpoint, { method: 'POST', body: body })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: fallback }; }); })
        .then(function (d) {
          if (d.ok) { form.reset(); list = []; store(list); render(); sent.hidden = false; err.hidden = true; sent.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          else showError(d.error || fallback);
        })
        .catch(function () { showError(fallback); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
