import { SITE, catalog, icon, esc, catUrl, waLink } from './site.mjs';

const rentCats = () => catalog.categories.filter((c) => c.mode === 'rent');
const saleCats = () => catalog.categories.filter((c) => c.mode === 'sale');

function header() {
  const rent = rentCats().map((c) => `<a href="${catUrl(c)}">${esc(c.name)}</a>`).join('');
  const buy = saleCats().map((c) => `<a href="${catUrl(c)}">${esc(c.name)}</a>`).join('');
  return `<header class="site-header"><div class="container">
  <a class="logo" href="/"><span class="logo-mark">${icon('activity')}</span><span>${esc(SITE.name)}<small>${esc(SITE.tagline)}</small></span></a>
  <nav class="nav" id="nav" aria-label="Main">
    <div class="cities"><a href="/rent">Rent</a><div class="cities-menu cities-menu--col">${rent}</div></div>
    <div class="cities"><a href="/buy">Buy</a><div class="cities-menu cities-menu--col">${buy}</div></div>
    <a href="/rent/cpm">CPM machines</a>
    <a href="/delivery">Delivery</a>
    <a class="nav-cart" href="/cart">${icon('shopping-cart')}<span class="sr-only">Cart</span><span class="cart-count" data-cart-count hidden>0</span></a>
    <a class="nav-cta" href="${waLink(`Hello ${SITE.name}, I have a question.`)}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp</a>
  </nav>
  <div class="header-tools">
    <a class="header-cart nav-cart" href="/cart">${icon('shopping-cart')}<span class="sr-only">Cart</span><span class="cart-count" data-cart-count hidden>0</span></a>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav"><span></span><span></span><span></span></button>
  </div>
</div></header>`;
}

function footer() {
  const rent = rentCats().slice(0, 10).map((c) => `<a href="${catUrl(c)}">${esc(c.name)}</a>`).join('');
  const buy = saleCats().map((c) => `<a href="${catUrl(c)}">${esc(c.name)}</a>`).join('');
  const emirates = [['Dubai', '/dubai'], ['Abu Dhabi', '/abu-dhabi'], ['Sharjah', '/sharjah'], ['Ajman', '/ajman'], ['Al Ain', '/al-ain']]
    .map(([n, u]) => `<a href="${u}">${n}</a>`).join('');
  return `<footer class="site-footer"><div class="container">
  <div class="footer-grid">
    <div>
      <h3>${esc(SITE.name)}</h3>
      <p>Medical equipment to rent or buy in Dubai. Choose online, we confirm on WhatsApp, you pay on delivery.</p>
      <p><a href="${waLink(`Hello ${SITE.name}`)}" target="_blank" rel="noopener">WhatsApp ${esc(SITE.phoneDisplay)}</a><br><a href="mailto:${SITE.email}">${SITE.email}</a></p>
      <h3>Emirates</h3>
      <nav class="footer-cities" aria-label="Emirates">${emirates}</nav>
    </div>
    <div><h3>Rent</h3><nav class="footer-cities" style="grid-template-columns:1fr" aria-label="Rent">${rent}<a href="/rent">All rentals</a></nav></div>
    <div><h3>Buy</h3><nav class="footer-cities" style="grid-template-columns:1fr" aria-label="Buy">${buy}</nav>
      <h3 style="margin-top:22px">Help</h3><nav class="footer-cities" style="grid-template-columns:1fr" aria-label="Help">
      <a href="/delivery">Delivery</a><a href="/rental-terms">Rental terms</a><a href="/returns">Returns</a><a href="/faq">FAQ</a><a href="/blog">Recovery blog</a><a href="/contact">Contact</a><a href="/privacy">Privacy</a></nav></div>
  </div>
  <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${esc(SITE.name)}</span><span>Rent from one day · Pay on delivery</span></div>
</div></footer>`;
}

function bar(waText) {
  return `<div class="mob-traka" role="region" aria-label="Quick contact">
  <p class="traka-info"><strong>${esc(SITE.name)}</strong> rent or buy medical equipment in Dubai · <a href="tel:${SITE.phone}">${esc(SITE.phoneDisplay)}</a></p>
  <div class="traka-gumbi">
    <a class="btn btn-primary traka-poziv" href="tel:${SITE.phone}">${icon('phone')}Call</a>
    <a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(waText)}">${icon('message-circle')}WhatsApp</a>
    <a class="btn btn-naruci" href="/cart">${icon('shopping-cart')}Cart</a>
  </div>
</div>`;
}

// page({ path, title, description, body, jsonld:[], waText, noindex })
export function page(o) {
  const url = SITE.origin + (o.path === '/' ? '/' : o.path);
  const ld = (o.jsonld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${url}">
${o.noindex ? '<meta name="robots" content="noindex">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.origin}/og-image.jpg">
<meta name="theme-color" content="#1d6f8c">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/inter-tight-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-tight-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/style.css">
${ld}
</head>
<body>
<a class="sr-only" href="#main">Skip to content</a>
${header()}
<main id="main">
${o.body}
</main>
${footer()}
${bar(o.waText || `Hello ${SITE.name}, I have a question.`)}
<script src="/assets/js/consent.js" defer></script>
<script src="/assets/js/pricing.js" defer></script>
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

export function breadcrumbLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE.origin + path })),
  };
}

export function faqLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };
}

export function faqHtml(faq) {
  const chev = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  return `<div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}${chev}</summary><div class="ans"><p>${esc(a)}</p></div></details>`).join('')}</div>`;
}

export function answerBox(answer, facts) {
  const check = '<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M16.7 4.15a.75.75 0 0 1 .15 1.05l-8 10.5a.75.75 0 0 1-1.13.08l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.9 3.89 7.48-9.82a.75.75 0 0 1 1.04-.14Z"/></svg>';
  return `<div class="answer-box">
  <p class="ab-label">${icon('badge-check')} Direct answer</p>
  <p class="ab-answer">${answer}</p>
  <p class="ab-key">Key facts</p>
  <ul>${facts.map((f) => `<li>${check}<span>${f}</span></li>`).join('')}</ul>
</div>`;
}
