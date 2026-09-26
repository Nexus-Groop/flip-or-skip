/* FLIP OR SKIP — browser-safe calculation engine. No modules, no DOM. */
(function (global) {
  'use strict';

  var MARKETPLACES = {
    ebay: { label: 'eBay', rate: 13.6, fixed: 0.40, note: '13.6% + $0.40 estimate for most categories' },
    poshmark: { label: 'Poshmark', rate: 20, fixed: 0, note: '20% for sales $15+; $2.95 under $15' },
    mercari: { label: 'Mercari', rate: 10, fixed: 0, note: '10% seller fee estimate' },
    facebook: { label: 'Facebook Marketplace', rate: 10, fixed: 0, note: '10% shipped-sale estimate; local pickup differs' },
    whatnot: { label: 'Whatnot', rate: 8, fixed: 0, note: '8% selling-fee estimate' },
    depop: { label: 'Depop', rate: 0, fixed: 0, note: '0% selling fee; payment processing may still apply' },
    etsy: { label: 'Etsy', rate: 6.5, fixed: 0, note: '6.5% transaction fee; processing/listing fees may also apply' },
    amazon: { label: 'Amazon', rate: 15, fixed: 0.30, note: '15% referral-fee estimate + $0.30 minimum/order component' },
    custom: { label: 'Custom', rate: 0, fixed: 0, note: 'Enter your own estimated fee' }
  };

  function number(value) {
    var n = Number.parseFloat(value);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function feeFor(marketplace, sale, customRate, customFixed) {
    if (marketplace === 'custom') {
      return {
        rate: clamp(number(customRate), 0, 100),
        fixed: number(customFixed),
        label: 'Custom'
      };
    }
    var model = MARKETPLACES[marketplace] || MARKETPLACES.ebay;
    if (marketplace === 'poshmark') {
      return sale > 0 && sale < 15
        ? { rate: 0, fixed: 2.95, label: model.label }
        : { rate: 20, fixed: 0, label: model.label };
    }
    return { rate: model.rate, fixed: model.fixed, label: model.label };
  }

  function calculate(input) {
    input = input || {};
    var buy = number(input.buy);
    var sale = number(input.sale);
    var shipping = number(input.shipping);
    var other = number(input.other);
    var target = clamp(number(input.target || 40), 0, 100);
    var fee = feeFor(input.marketplace || 'ebay', sale, input.customRate, input.customFixed);

    var percentageFee = sale * (fee.rate / 100);
    var fees = percentageFee + fee.fixed;
    var operatingCosts = buy + shipping + other;
    var totalCost = operatingCosts + fees;
    var profit = sale - totalCost;
    var roi = buy > 0 ? (profit / buy) * 100 : 0;
    var margin = sale > 0 ? (profit / sale) * 100 : 0;
    var complete = buy > 0 && sale > 0;
    var verdict = 'ENTER NUMBERS';

    if (complete) {
      if (roi >= target) verdict = 'BUY';
      else if (roi >= target * 0.5) verdict = 'CONSIDER';
      else verdict = 'SKIP';
    }

    var breakEvenDenominator = 1 - fee.rate / 100;
    var breakEven = breakEvenDenominator > 0
      ? (operatingCosts + fee.fixed) / breakEvenDenominator
      : Infinity;

    return {
      buy: buy, sale: sale, shipping: shipping, other: other,
      target: target, feeRate: fee.rate, feeFixed: fee.fixed,
      percentageFee: percentageFee, fees: fees,
      operatingCosts: operatingCosts, totalCost: totalCost,
      profit: profit, roi: roi, margin: margin,
      breakEven: breakEven, complete: complete, verdict: verdict,
      marketplace: fee.label
    };
  }

  function money(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value || 0);
  }

  function percent(value) { return (Number(value) || 0).toFixed(1) + '%'; }

  global.FlipOrSkipCalculator = Object.freeze({
    MARKETPLACES: Object.freeze(MARKETPLACES),
    calculate: calculate,
    money: money,
    percent: percent
  });
})(window);
