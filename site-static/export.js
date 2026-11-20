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

    var live = document.querySelector('[data-live]');
    if (live) {
      var n = 0;
      document.querySelectorAll('.card[data-months]').forEach(function (c) { if (c.classList.contains('in-season')) n++; });
      if (count) n = count;
      if (n) live.textContent = names[month - 1] + ': ' + n + ' crops in season now';
    }

    var pb = document.querySelector('[data-pricebox]');
    if (pb) pb.addEventListener('submit', function (e) {
      e.preventDefault();
      var opt = pb.product.options[pb.product.selectedIndex];
      var msg = 'Hello Openwave Export, please send today\'s price.\nProduct: ' + opt.getAttribute('data-name') +
        '\nDestination: ' + (pb.to.value.trim() || '___') + '\nQuantity: ' + pb.qty.value;
      window.open('https://wa.me/' + pb.getAttribute('data-wa') + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
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
