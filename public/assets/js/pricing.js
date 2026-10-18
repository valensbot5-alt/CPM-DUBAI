// Rental price engine, shared by the browser and /api/order.
// Price = cheapest combination of rental periods whose total days cover the
// requested duration (it may cover more). Same behaviour as the market's
// rental engines: a 25 day rental can cost less than 25 single days.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CpmPricing = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MAX_DAYS = 366;
  var DAY_MS = 86400000;

  function toFils(aed) { return Math.round(Number(aed) * 100); }

  function cleanPeriods(periods) {
    if (!Array.isArray(periods)) return [];
    return periods
      .map(function (p) { return { days: Math.floor(Number(p.days)), fils: toFils(p.price) }; })
      .filter(function (p) { return p.days >= 1 && p.days <= MAX_DAYS && p.fils > 0; });
  }

  // Returns { total, parts: [{days, price, count}] } in AED, or null.
  function quote(periods, days) {
    var list = cleanPeriods(periods);
    days = Number(days);
    if (!list.length || !Number.isInteger(days) || days < 1 || days > MAX_DAYS) return null;
    var longest = Math.max.apply(null, list.map(function (p) { return p.days; }));
    var limit = days + longest;
    var cost = new Array(limit + 1).fill(Infinity);
    var pick = new Array(limit + 1).fill(-1);
    cost[0] = 0;
    for (var d = 1; d <= limit; d++) {
      for (var i = 0; i < list.length; i++) {
        var prev = d - list[i].days;
        if (prev >= 0 && cost[prev] + list[i].fils < cost[d]) {
          cost[d] = cost[prev] + list[i].fils;
          pick[d] = i;
        }
      }
    }
    var best = -1;
    for (var c = days; c <= limit; c++) {
      if (cost[c] < Infinity && (best < 0 || cost[c] < cost[best])) best = c;
    }
    if (best < 0) return null;
    var counts = {};
    for (var at = best; at > 0; at -= list[pick[at]].days) counts[pick[at]] = (counts[pick[at]] || 0) + 1;
    var parts = Object.keys(counts)
      .map(function (k) { return { days: list[k].days, price: list[k].fils / 100, count: counts[k] }; })
      .sort(function (a, b) { return b.days - a.days; });
    return { total: cost[best] / 100, parts: parts };
  }

  // Billable days = end date minus start date (YYYY-MM-DD, calendar days).
  function billableDays(from, to) {
    var re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(String(from)) || !re.test(String(to))) return null;
    var a = Date.parse(from + 'T00:00:00Z');
    var b = Date.parse(to + 'T00:00:00Z');
    if (isNaN(a) || isNaN(b)) return null;
    var n = Math.round((b - a) / DAY_MS);
    return n >= 1 && n <= MAX_DAYS ? n : null;
  }

  // "From" line for cards: shortest period price.
  function fromPrice(periods) {
    var list = cleanPeriods(periods).sort(function (a, b) { return a.days - b.days; });
    return list.length ? { days: list[0].days, price: list[0].fils / 100 } : null;
  }

  function formatAed(n) {
    var fixed = Math.round(n * 100) % 100 === 0 ? String(Math.round(n)) : n.toFixed(2);
    return 'AED ' + fixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return { quote: quote, billableDays: billableDays, fromPrice: fromPrice, formatAed: formatAed, MAX_DAYS: MAX_DAYS };
});
