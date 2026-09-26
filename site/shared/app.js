/* FLIP OR SKIP — UI controller. Uses only classic browser APIs. */
(function (global) {
  'use strict';
  var C = global.FlipOrSkipCalculator;
  if (!C) throw new Error('FLIP OR SKIP calculator engine failed to load.');

  function $(id) { return document.getElementById(id); }
  function setText(id, value) { var el = $(id); if (el) el.textContent = value; }
  function safeStorageGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function safeStorageSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }

  var form = $('dealForm');
  var ids = ['buy','sale','shipping','other','marketplace','customRate','customFixed','target'];
  var fields = ids.map($).filter(Boolean);

  function readInput() {
    return {
      buy: $('buy').value,
      sale: $('sale').value,
      shipping: $('shipping').value,
      other: $('other').value,
      marketplace: $('marketplace').value,
      customRate: $('customRate').value,
      customFixed: $('customFixed').value,
      target: $('target').value
    };
  }

  function render() {
    var result = C.calculate(readInput());
    var verdict = result.verdict.toLowerCase().replace(/\s+/g, '-');
    var complete = result.complete;

    setText('targetOut', C.percent(result.target));
    setText('profit', complete ? C.money(result.profit) : '—');
    setText('roi', complete ? C.percent(result.roi) : '—');
    setText('margin', complete ? C.percent(result.margin) : '—');
    setText('verdict', result.verdict);
    setText('feeRate', result.feeRate.toFixed(1) + '%');
    setText('saleSummary', complete ? C.money(result.sale) : '—');
    setText('feeSummary', complete ? C.money(result.fees) : '—');
    setText('costSummary', complete ? C.money(result.operatingCosts) : '—');
    setText('profitBreak', complete ? C.money(result.profit) : '—');
    setText('insightFee', complete ? 'Estimated selling fees: ' + C.money(result.fees) + ' (' + result.feeRate.toFixed(1) + '% plus any fixed fee).' : 'Enter a buy and sale price to see the fee impact.');
    setText('insightBreakEven', complete && Number.isFinite(result.breakEven) ? 'Estimated break-even sale: ' + C.money(result.breakEven) + '.' : 'Your break-even sale price will appear here.');

    var box = $('verdictBox');
    if (box) box.dataset.verdict = verdict;
    document.documentElement.style.setProperty('--roi-progress', result.target + '%');

    var custom = $('marketplace').value === 'custom';
    $('customFeeWrap').hidden = !custom;

    var profitPart = Math.max(0, result.profit);
    var costPart = Math.max(0, result.operatingCosts);
    var feePart = Math.max(0, result.fees);
    var total = profitPart + costPart + feePart;
    var profitShare = total ? profitPart / total * 100 : 0;
    var costShare = total ? costPart / total * 100 : 100;
    var donut = $('donut');
    if (donut) donut.style.setProperty('--profit-stop', profitShare + '%');
    if (donut) donut.style.setProperty('--cost-stop', (profitShare + costShare) + '%');
    setText('donutCenter', complete ? Math.round(profitShare) + '%' : '—');
    document.body.dataset.state = verdict;

    return result;
  }

  function clearAll() {
    form.reset();
    $('marketplace').value = 'ebay';
    $('target').value = '40';
    $('customRate').value = '';
    $('customFixed').value = '';
    render();
    $('buy').focus();
  }

  fields.forEach(function (field) {
    field.addEventListener('input', render, { passive: true });
    field.addEventListener('change', render, { passive: true });
  });
  $('clearBtn').addEventListener('click', clearAll);
  $('themeBtn').addEventListener('click', function () {
    document.documentElement.classList.toggle('light');
    safeStorageSet('flip-theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });

  function openGuide() { $('guide').hidden = false; document.body.classList.add('modal-open'); }
  function closeGuide() { $('guide').hidden = true; document.body.classList.remove('modal-open'); }
  $('guideBtn').addEventListener('click', openGuide);
  $('closeGuide').addEventListener('click', closeGuide);
  $('guideBackdrop').addEventListener('click', closeGuide);

  document.querySelectorAll('[data-help]').forEach(function (button) {
    button.addEventListener('click', function () {
      var panel = $(button.getAttribute('data-help'));
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    });
  });

  var savedTheme = safeStorageGet('flip-theme');
  if (savedTheme === 'light') document.documentElement.classList.add('light');
  render();

  if (new URLSearchParams(global.location.search).get('selftest') === '1') {
    runSelfTest();
  }

  function runSelfTest() {
    var results = [];
    function test(name, fn) {
      try { fn(); results.push({ name: name, pass: true }); }
      catch (e) { results.push({ name: name, pass: false, error: e.message }); }
    }
    function assert(condition, message) { if (!condition) throw new Error(message); }
    function input(id, value) { var el = $(id); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }

    test('engine loads', function () { assert(C.calculate({ buy: 30, sale: 60, marketplace: 'ebay', target: 40 }).verdict === 'BUY', 'engine result incorrect'); });
    test('live inputs calculate', function () {
      clearAll(); input('buy','30'); input('sale','60'); input('shipping','5'); input('other','2');
      assert($('profit').textContent === '$14.44', 'profit mismatch: ' + $('profit').textContent);
      assert($('roi').textContent === '48.1%', 'ROI mismatch: ' + $('roi').textContent);
      assert($('verdict').textContent === 'BUY', 'verdict mismatch');
    });
    test('marketplace changes', function () {
      $('marketplace').value = 'poshmark'; $('marketplace').dispatchEvent(new Event('change', { bubbles: true }));
      assert($('feeRate').textContent === '20.0%', 'Poshmark rate missing');
    });
    test('custom fee works', function () {
      $('marketplace').value = 'custom'; $('marketplace').dispatchEvent(new Event('change', { bubbles: true }));
      input('customRate','7.5'); input('customFixed','0.50');
      assert($('feeRate').textContent === '7.5%', 'custom rate missing');
      assert($('customFeeWrap').hidden === false, 'custom controls hidden');
    });
    test('native range input works', function () {
      var slider = $('target'); slider.value = '85'; slider.dispatchEvent(new Event('input', { bubbles: true }));
      assert($('targetOut').textContent === '85.0%', 'slider did not update');
      assert(document.documentElement.style.getPropertyValue('--roi-progress') === '85%', 'slider progress missing');
    });
    test('verdict responds to target', function () {
      assert($('verdict').textContent === 'CONSIDER' || $('verdict').textContent === 'SKIP', 'verdict did not respond');
    });
    test('clear resets state', function () {
      $('clearBtn').click();
      assert($('buy').value === '' && $('sale').value === '', 'inputs not cleared');
      assert($('verdict').textContent === 'ENTER NUMBERS', 'verdict not reset');
      assert($('targetOut').textContent === '40.0%', 'target not reset');
    });
    test('help toggles', function () {
      var btn = document.querySelectorAll('[data-help]')[0]; var panel = document.getElementById('dealHelp');
      assert(btn && panel, 'help test elements missing'); btn.click(); assert(panel.hidden === false, 'help did not open'); btn.click(); assert(panel.hidden === true, 'help did not close');
    });
    test('theme toggles', function () { var before = document.documentElement.classList.contains('light'); $('themeBtn').click(); assert(document.documentElement.classList.contains('light') !== before, 'theme did not toggle'); $('themeBtn').click(); });
    test('guide opens and closes', function () { $('guideBtn').click(); assert($('guide').hidden === false, 'guide did not open'); $('closeGuide').click(); assert($('guide').hidden === true, 'guide did not close'); });
    test('no horizontal overflow', function () { assert(document.documentElement.scrollWidth <= window.innerWidth + 1, 'horizontal overflow: ' + document.documentElement.scrollWidth + ' > ' + window.innerWidth); });

    var passed = results.filter(function (r) { return r.pass; }).length;
    var failed = results.length - passed;
    var out = $('selfTest');
    out.hidden = false;
    out.dataset.status = failed ? 'fail' : 'pass';
    out.innerHTML = '<strong>Browser self-test: ' + passed + '/' + results.length + ' passed</strong>' + results.map(function (r) { return '<div>' + (r.pass ? '✓' : '✗') + ' ' + r.name + (r.error ? ' — ' + r.error : '') + '</div>'; }).join('');
  }
})(window);
