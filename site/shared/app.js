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


  function dealResult() {
    return C.calculate(readInput());
  }

  function pageUrl() {
    try { return String(global.location.href || '').split('?')[0].split('#')[0]; }
    catch (_) { return ''; }
  }

  function buildShareText(result) {
    return [
      'FLIP OR SKIP — ' + result.verdict,
      '',
      'Buy price: ' + C.money(result.buy),
      'Expected sale: ' + C.money(result.sale),
      'Platform: ' + result.marketplace,
      'Estimated fees: ' + C.money(result.fees),
      'Shipping: ' + C.money(result.shipping),
      'Other costs: ' + C.money(result.other),
      '',
      'Estimated profit: ' + C.money(result.profit),
      'ROI: ' + C.percent(result.roi),
      'Margin: ' + C.percent(result.margin),
      'Target ROI: ' + C.percent(result.target),
      '',
      'Screening estimate — not a guarantee of profit.',
      pageUrl()
    ].join('\n');
  }

  function setShareStatus(message, state) {
    var el = $('shareStatus');
    if (!el) return;
    el.textContent = message;
    el.dataset.state = state || '';
  }

  function requireDeal() {
    var result = dealResult();
    if (!result.complete) {
      setShareStatus('Enter a buy price and expected sale before sharing.', 'error');
      return null;
    }
    return result;
  }

  function drawShareCard(result) {
    if (!document.createElement) return null;
    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx || !canvas.toDataURL) return null;

    var accent = result.verdict === 'BUY' ? '#35e38b' : result.verdict === 'CONSIDER' ? '#ffd166' : '#ff5f66';
    ctx.fillStyle = '#090b0d';
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = '#111519';
    ctx.fillRect(64, 64, 952, 952);

    ctx.fillStyle = '#35e38b';
    ctx.font = '800 26px Arial, sans-serif';
    ctx.fillText('FLIP OR SKIP', 112, 132);

    ctx.fillStyle = '#89939d';
    ctx.font = '600 20px Arial, sans-serif';
    ctx.fillText('RUN THE NUMBERS BEFORE YOU BUY', 112, 171);

    ctx.fillStyle = '#151a1f';
    ctx.fillRect(112, 220, 856, 150);
    ctx.fillStyle = accent;
    ctx.font = '900 64px Arial, sans-serif';
    ctx.fillText(result.verdict, 148, 316);
    ctx.fillStyle = '#f5f7f8';
    ctx.font = '700 24px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(result.marketplace, 932, 286);
    ctx.fillStyle = '#89939d';
    ctx.font = '600 20px Arial, sans-serif';
    ctx.fillText('Target ROI ' + C.percent(result.target), 932, 322);
    ctx.textAlign = 'left';

    var metrics = [
      ['PROFIT', C.money(result.profit)],
      ['ROI', C.percent(result.roi)],
      ['MARGIN', C.percent(result.margin)]
    ];
    metrics.forEach(function (m, i) {
      var x = 112 + i * 286;
      ctx.fillStyle = '#151a1f';
      ctx.fillRect(x, 402, 260, 132);
      ctx.fillStyle = '#89939d';
      ctx.font = '700 17px Arial, sans-serif';
      ctx.fillText(m[0], x + 24, 443);
      ctx.fillStyle = i === 0 ? accent : '#f5f7f8';
      ctx.font = '900 34px Arial, sans-serif';
      ctx.fillText(m[1], x + 24, 494);
    });

    ctx.fillStyle = '#f5f7f8';
    ctx.font = '800 23px Arial, sans-serif';
    ctx.fillText('DEAL BREAKDOWN', 112, 596);

    var rows = [
      ['Buy price', C.money(result.buy)],
      ['Expected sale', C.money(result.sale)],
      ['Estimated fees', C.money(result.fees)],
      ['Shipping', C.money(result.shipping)],
      ['Other costs', C.money(result.other)]
    ];
    rows.forEach(function (row, i) {
      var y = 644 + i * 55;
      ctx.fillStyle = '#89939d';
      ctx.font = '600 20px Arial, sans-serif';
      ctx.fillText(row[0], 112, y);
      ctx.fillStyle = '#f5f7f8';
      ctx.font = '800 20px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(row[1], 932, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#283038';
      ctx.fillRect(112, y + 18, 820, 1);
    });

    ctx.fillStyle = '#89939d';
    ctx.font = '500 16px Arial, sans-serif';
    ctx.fillText('Screening estimate — not a guarantee of profit.', 112, 958);
    ctx.fillStyle = '#35e38b';
    ctx.font = '700 16px Arial, sans-serif';
    ctx.fillText('FLIP OR SKIP', 112, 992);

    return canvas;
  }

  function shareFileFromCanvas(canvas) {
    if (!canvas || !global.File || !global.atob) return null;
    try {
      var data = canvas.toDataURL('image/png');
      var base64 = data.split(',')[1];
      var binary = global.atob(base64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new global.File([bytes], 'flip-or-skip-breakdown.png', { type: 'image/png' });
    } catch (_) {
      return null;
    }
  }

  function nativeShare(result, hint) {
    var summary = buildShareText(result);
    var nav = global.navigator || {};
    var canvas = drawShareCard(result);
    var file = shareFileFromCanvas(canvas);
    var shareData = {
      title: 'FLIP OR SKIP — ' + result.verdict,
      text: summary
    };
    if (pageUrl()) shareData.url = pageUrl();

    if (file && nav.canShare && nav.canShare({ files: [file] })) {
      shareData.files = [file];
    }

    if (nav.share) {
      setShareStatus(hint || 'Opening your share sheet…', 'working');
      nav.share(shareData).then(function () {
        setShareStatus('Shared successfully.', 'success');
      }).catch(function (error) {
        if (error && error.name === 'AbortError') {
          setShareStatus('Share canceled.', '');
          return;
        }
        setShareStatus('Your browser could not open the share sheet. Try Email or Save PNG.', 'error');
      });
      return true;
    }
    return false;
  }

  function savePng() {
    var result = requireDeal();
    if (!result) return;
    var canvas = drawShareCard(result);
    if (!canvas || !canvas.toDataURL) {
      setShareStatus('PNG export is not supported by this browser.', 'error');
      return;
    }
    var link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'flip-or-skip-breakdown.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareStatus('PNG created. Check your downloads/files.', 'success');
  }

  function emailDeal() {
    var result = requireDeal();
    if (!result) return;
    var subject = 'FLIP OR SKIP — ' + result.verdict + ' deal breakdown';
    var body = buildShareText(result);
    global.location.href = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    setShareStatus('Opening your email app with the deal summary.', 'working');
  }

  function textDeal() {
    var result = requireDeal();
    if (!result) return;
    if (nativeShare(result, 'Choose Messages from the share sheet.')) return;

    var summary = buildShareText(result);
    var nav = global.navigator || {};
    if (nav.clipboard && nav.clipboard.writeText) {
      nav.clipboard.writeText(summary).then(function () {
        setShareStatus('Summary copied. Opening Messages — paste it into your text.', 'success');
        global.location.href = 'sms:';
      }).catch(function () {
        setShareStatus('Opening Messages. Use Email or Save PNG if you need the full summary.', '');
        global.location.href = 'sms:';
      });
    } else {
      setShareStatus('Opening Messages. Use Email or Save PNG if you need the full summary.', '');
      global.location.href = 'sms:';
    }
  }

  var shareBtn = $('shareBtn');
  var emailBtn = $('emailBtn');
  var textBtn = $('textBtn');
  var savePngBtn = $('savePngBtn');
  if (shareBtn) shareBtn.addEventListener('click', function () {
    var result = requireDeal();
    if (!result) return;
    if (!nativeShare(result, 'Opening your share sheet…')) savePng();
  });
  if (emailBtn) emailBtn.addEventListener('click', emailDeal);
  if (textBtn) textBtn.addEventListener('click', textDeal);
  if (savePngBtn) savePngBtn.addEventListener('click', savePng);

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
    test('share controls ready', function () { assert($('shareBtn') && $('emailBtn') && $('textBtn') && $('savePngBtn'), 'share controls missing'); });
    test('no horizontal overflow', function () { assert(document.documentElement.scrollWidth <= window.innerWidth + 1, 'horizontal overflow: ' + document.documentElement.scrollWidth + ' > ' + window.innerWidth); });

    var passed = results.filter(function (r) { return r.pass; }).length;
    var failed = results.length - passed;
    var out = $('selfTest');
    out.hidden = false;
    out.dataset.status = failed ? 'fail' : 'pass';
    out.innerHTML = '<strong>Browser self-test: ' + passed + '/' + results.length + ' passed</strong>' + results.map(function (r) { return '<div>' + (r.pass ? '✓' : '✗') + ' ' + r.name + (r.error ? ' — ' + r.error : '') + '</div>'; }).join('');
  }
})(window);
