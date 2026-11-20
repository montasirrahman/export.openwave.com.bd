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
    document.querySelectorAll('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.getAttribute('data-filter'), shown = 0;
        document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        grid.querySelectorAll('.card').forEach(function (c) {
          var ok = f === 'all' || (f === 'season' ? c.classList.contains('in-season') : c.getAttribute('data-kind') === f);
          c.classList.toggle('hide', !ok); if (ok) shown++;
        });
        document.querySelector('[data-empty]').hidden = shown > 0;
      });
    });

    var form = document.querySelector('form[data-api]');
    if (!form) return;
    var params = new URLSearchParams(location.search);
    var want = params.get('product');
    if (want) form.querySelectorAll('input[name="products"]').forEach(function (cb) { if (cb.getAttribute('data-slug') === want) cb.checked = true; });
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
      fetch(endpoint, { method: 'POST', body: body })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: fallback }; }); })
        .then(function (d) {
          if (d.ok) { form.reset(); sent.hidden = false; err.hidden = true; sent.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          else showError(d.error || fallback);
        })
        .catch(function () { showError(fallback); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
