import { SITE, catalog, pricing, icon, esc, aed, waLink, catUrl, productUrl, priceLine, categoryFrom, periodLabel, rentFrom } from './site.mjs';
import { page, breadcrumbLd, faqLd, faqHtml, answerBox } from './layout.mjs';

const rentCats = () => catalog.categories.filter((c) => c.mode === 'rent');
const saleCats = () => catalog.categories.filter((c) => c.mode === 'sale');

const HOW = [
  ['shopping-cart', 'Choose online', 'Pick the equipment, the rental dates or the quantity, and send the order request. No payment online.'],
  ['message-circle', 'We confirm on WhatsApp', 'We reply with availability, delivery time and the delivery fee before anything is charged.'],
  ['truck', 'Delivered, you pay on delivery', 'Cash or card at the door. Rentals are collected when you are done, extensions by message.'],
];

function tiles(cats, tag = 'h3') {
  return `<div class="tiles">${cats.map((c) => `<a class="tile" href="${catUrl(c)}"><span class="ic">${icon(c.icon)}</span><${tag} class="tile-h">${esc(c.name)}</${tag}><p class="from">${categoryFrom(c)}</p></a>`).join('')}</div>`;
}

export function productCard(p) {
  const c = catalog.catBySlug.get(p.category);
  const pl = priceLine(p);
  const extra = catalog.mode(p) === 'rent' ? monthLine(p) : '';
  return `<a class="model" href="${productUrl(p)}"><div class="ph"><span class="ph-ic">${icon(c.icon)}</span></div>
  <div class="body"><span class="tag">${catalog.mode(p) === 'rent' ? 'Rent' : 'Buy'}</span><h3>${esc(p.name)}</h3><div class="price">${pl.main} <span>${pl.sub}</span></div>${extra}</div></a>`;
}

// Second line on rental cards: what one month costs (cheapest variant).
function monthLine(p) {
  let best = null;
  for (const v of p.variants) {
    const q = pricing.quote(catalog.periods(p, v.id), 30);
    if (q && (best === null || q.total < best)) best = q.total;
  }
  return best ? `<p class="rate">${aed(best)} for 1 month</p>` : '';
}

const HOME_FAQ = [
  ['Do I pay online?', 'No. You send an order request, we confirm availability and the delivery fee on WhatsApp, and you pay on delivery in cash or by card.'],
  ['What is the shortest rental?', 'One day for most equipment. Some items, such as hospital beds, oxygen and CPAP, are rented in packages of one, two or four weeks.'],
  ['Which emirates do you deliver to?', 'Dubai, and other emirates on request. We confirm the delivery time and fee before you pay.'],
  ['Can I extend a rental?', 'Yes. Send us a message before the end date and we extend at the same rates if the unit is free.'],
  ['Do I need a prescription?', 'Not for mobility aids, beds or CPM machines. Oxygen, CPAP, BiPAP, ventilators and feeding pumps are supplied to the settings your doctor prescribed.'],
  ['What do I need at delivery?', 'A copy of your Emirates ID or passport for rentals, and payment.'],
];

export function home() {
  const popular = ['cpm-machine-knee-hip', 'hospital-bed-electric', 'wheelchair-lightweight-aluminium', 'oxygen-concentrator', 'patient-lifter-135', 'knee-scooter', 'auto-cpap', 'mobility-scooter-foldable']
    .map((s) => catalog.bySlug.get(s)).filter(Boolean);
  const buyPopular = ['buy-electric-bed-5-function', 'buy-oxygen-concentrator-5l', 'buy-auto-cpap', 'buy-power-wheelchair-lightweight']
    .map((s) => catalog.bySlug.get(s)).filter(Boolean);
  const cpm = catalog.bySlug.get('cpm-machine-knee-hip');
  const body = `
<section class="hero"><div class="container hero-grid">
  <div class="hero-copy">
    <span class="eyebrow">${icon('map-pin')} Dubai and other emirates</span>
    <h1>Medical equipment to rent or buy in Dubai</h1>
    <p class="lead">Hospital beds, wheelchairs, CPM machines, oxygen and more, delivered to your home. Choose online, we confirm on WhatsApp, you pay on delivery.</p>
    <p class="hero-cijena"><strong>Rent from ${aed(15)} per day</strong> · from one day · no payment online</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="/rent">${icon('calendar-days')}Rent equipment</a>
      <a class="btn btn-ghost" href="/buy">${icon('package')}Buy equipment</a>
    </div>
    <p class="hero-note">Questions? <a href="${waLink(`Hello ${SITE.name}, I have a question.`)}" target="_blank" rel="noopener">WhatsApp us</a> and a person replies.</p>
  </div>
  <div class="hero-media">
    <div class="frame">${tiles(rentCats().slice(0, 6), 'p')}</div>
  </div>
</div></section>

<section class="article"><div class="container">
  <h2>How does equipment rental work in Dubai, and what does it cost?</h2>
  ${answerBox(
    `You choose the equipment and the rental dates online and send an order request. We confirm availability, delivery time and the delivery fee on WhatsApp, deliver to your home and you pay on delivery. Prices start at ${aed(15)} per day for a wheelchair; a hospital bed is ${aed(630)} for up to two weeks.`,
    ['Rent from one day, extend by message', `CPM machine from ${aed(cpm.rent.periods[0].price)} per week`, 'Pay on delivery, cash or card', 'Copy of Emirates ID or passport at delivery', 'Buy instead of renting if you need it for months'],
  )}
</div></section>

<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>Rent</h2><p class="sub">Daily, weekly and monthly rates. The price for your dates is calculated on every product page.</p></div>
  ${tiles(rentCats())}
</div></section>

<section><div class="container">
  <div class="section-head"><h2>Most rented</h2></div>
  <div class="models">${popular.map(productCard).join('')}</div>
</div></section>

<section class="bg-soft"><div class="container">
  <div class="section-head"><h2>Buy</h2><p class="sub">Home care equipment for long term use.</p></div>
  ${tiles(saleCats())}
  <div class="models" style="margin-top:22px">${buyPopular.map(productCard).join('')}</div>
</div></section>

<section><div class="container">
  <div class="section-head center"><h2>How ordering works</h2></div>
  <div class="features">${HOW.map(([ic, h, p]) => `<div class="feature"><div class="ic">${icon(ic)}</div><h3>${h}</h3><p>${p}</p></div>`).join('')}</div>
</div></section>

<section class="bg-soft"><div class="container">
  <div class="section-head center"><h2>Common questions</h2></div>
  ${faqHtml(HOME_FAQ)}
</div></section>

<section><div class="container"><div class="cta-band">
  <h2>Not sure what you need?</h2>
  <p>Tell us about the surgery or the patient and we suggest the equipment, on WhatsApp.</p>
  <div class="hero-cta" style="justify-content:center">
    <a class="btn btn-wa" href="${waLink(`Hello ${SITE.name}, I need help choosing equipment.`)}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp us</a>
    <a class="btn btn-ghost" href="/rent">See all rentals</a>
  </div>
</div></div></section>`;
  return page({
    path: '/',
    title: 'Medical Equipment Rental and Sale in Dubai | CPM Rent Dubai',
    description: `Rent or buy hospital beds, wheelchairs, CPM machines, oxygen concentrators and more in Dubai. Rent from ${aed(15)} per day, pay on delivery.`,
    body,
    jsonld: [
      { '@context': 'https://schema.org', '@type': 'Organization', name: SITE.name, url: SITE.origin, email: SITE.email, areaServed: 'AE' },
      faqLd(HOME_FAQ),
    ],
  });
}

export function modeIndex(mode) {
  const cats = mode === 'rent' ? rentCats() : saleCats();
  const title = mode === 'rent' ? 'Medical equipment rental in Dubai' : 'Buy medical equipment in Dubai';
  const lead = mode === 'rent'
    ? 'Daily, weekly and monthly rental. Choose your dates on the product page to see the exact price.'
    : 'Home care equipment for long term use, delivered and paid on delivery.';
  const path = mode === 'rent' ? '/rent' : '/buy';
  const sections = cats.map((c) => `<section${cats.indexOf(c) % 2 ? ' class="bg-soft"' : ''}><div class="container">
  <div class="section-head"><h2><a href="${catUrl(c)}">${esc(c.name)}</a></h2><p class="sub">${esc(c.intro)}</p></div>
  <div class="models">${catalog.productsIn(c.slug).map(productCard).join('')}</div>
</div></section>`).join('');
  return page({
    path,
    title: `${title} | ${SITE.name}`,
    description: `${title}: ${cats.map((c) => c.name).slice(0, 6).join(', ')} and more. Pay on delivery.`,
    body: `<section class="page-hero"><div class="container"><h1>${title}</h1><p class="lead">${lead}</p></div></section>
<section style="padding-top:28px"><div class="container">${tiles(cats)}</div></section>${sections}`,
    jsonld: [breadcrumbLd([['Home', '/'], [mode === 'rent' ? 'Rent' : 'Buy', path]])],
  });
}

export function category(c) {
  const items = catalog.productsIn(c.slug);
  const parent = c.mode === 'rent' ? ['Rent', '/rent'] : ['Buy', '/buy'];
  const h1 = c.mode === 'rent' ? `${c.name} rental in Dubai` : `Buy ${c.name.toLowerCase()} in Dubai`;
  const rows = c.mode === 'rent' ? items.flatMap((p) => p.variants.map((v) => {
    const per = catalog.periods(p, v.id);
    const cells = [1, 7, 30].map((d) => aed(pricing.quote(per, d).total));
    const label = p.variants.length > 1 ? `${p.name}, ${v.label}` : p.name;
    return `<tr><th scope="row"><a href="${productUrl(p)}">${esc(label)}</a></th>${cells.map((x, i) => `<td data-label="${['1 day', '1 week', '1 month'][i]}" class="iznos">${x}</td>`).join('')}</tr>`;
  })).join('') : '';
  const table = rows ? `<section class="article"><div class="container prose">
  <h2>${esc(c.name)} rental prices</h2>
  <table class="tablica"><caption>Price for the whole period, AED including VAT</caption><thead><tr><th scope="col">Equipment</th><th scope="col">1 day</th><th scope="col">1 week</th><th scope="col">1 month</th></tr></thead><tbody>${rows}</tbody></table>
  <p>Some items are rented in packages, so one day costs the same as the whole package. Delivery is confirmed separately on WhatsApp before you pay.</p>
</div></section>` : '';
  return page({
    path: catUrl(c),
    title: `${h1} | ${SITE.name}`,
    description: `${c.intro} ${categoryFrom(c).replace(/<[^>]+>/g, '')}. Pay on delivery.`,
    body: `<section class="page-hero"><div class="container">
  <p class="breadcrumb"><a href="/">Home</a> · <a href="${parent[1]}">${parent[0]}</a></p>
  <h1>${esc(h1)}</h1><p class="lead">${esc(c.intro)}</p></div></section>
<section style="padding-top:28px"><div class="container"><div class="models">${items.map(productCard).join('')}</div></div></section>
${table}`,
    jsonld: [breadcrumbLd([['Home', '/'], parent, [c.name, catUrl(c)]]), {
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: items.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.origin + productUrl(p), name: p.name })),
    }],
  });
}

export function product(p) {
  const c = catalog.catBySlug.get(p.category);
  const isRent = catalog.mode(p) === 'rent';
  const parent = isRent ? ['Rent', '/rent'] : ['Buy', '/buy'];
  const check = icon('check');
  const data = isRent
    ? { slug: p.slug, mode: 'rent', name: p.name, variants: p.variants.map((v) => ({ id: v.id, label: v.label, periods: catalog.periods(p, v.id) })) }
    : { slug: p.slug, mode: 'sale', name: p.name, price: p.sale.price };
  const variantSelect = isRent && p.variants.length > 1
    ? `<div class="field"><label for="variant">Option</label><select id="variant">${p.variants.map((v) => `<option value="${esc(v.id)}">${esc(v.label)}</option>`).join('')}</select></div>` : '';
  const firstPeriods = isRent ? catalog.periods(p, p.variants[0].id) : null;
  const periodsTable = isRent
    ? `<table class="periods" data-periods><caption class="sr-only">Rental rates</caption><tbody>${firstPeriods.map((x) => `<tr><td>${periodLabel(x.days)}</td><td>${aed(x.price)}</td></tr>`).join('')}</tbody></table>`
    : '';
  const box = isRent ? `
    ${variantSelect}
    <div class="row2">
      <div class="field"><label for="from">Start</label><input type="date" id="from"></div>
      <div class="field"><label for="to">End</label><input type="date" id="to"></div>
    </div>
    <div class="quote"><span>Total</span><b data-total>${aed(pricing.quote(firstPeriods, 7).total)}</b></div>
    <p class="quote-detail" data-detail>For 7 days. Change the dates to recalculate.</p>
    <button class="btn btn-primary" type="button" data-add>${icon('shopping-cart')}Add to cart</button>
    <a class="btn btn-wa" data-wa href="${waLink(`Hello, I would like to rent: ${p.name}`)}" target="_blank" rel="noopener">${icon('message-circle')}Order on WhatsApp</a>
    <p class="added" data-added hidden>Added. <a href="/cart">Go to cart</a></p>
    ${periodsTable}
    <p class="note">AED including VAT. Delivery fee is confirmed on WhatsApp before you pay. No payment online.</p>`
    : `
    <div class="field"><label for="qty">Quantity</label><input type="number" id="qty" min="1" max="10" value="1" inputmode="numeric"></div>
    <div class="quote"><span>Price</span><b data-total>${aed(p.sale.price)}</b></div>
    <p class="quote-detail" data-detail>Including VAT. Delivery fee confirmed on WhatsApp.</p>
    <button class="btn btn-primary" type="button" data-add>${icon('shopping-cart')}Add to cart</button>
    <a class="btn btn-wa" data-wa href="${waLink(`Hello, I would like to buy: ${p.name}`)}" target="_blank" rel="noopener">${icon('message-circle')}Order on WhatsApp</a>
    <p class="added" data-added hidden>Added. <a href="/cart">Go to cart</a></p>
    <p class="note">Pay on delivery, cash or card. No payment online.</p>`;
  const related = catalog.productsIn(p.category).filter((x) => x.slug !== p.slug).slice(0, 4);
  const pl = priceLine(p);
  const offer = isRent
    ? { '@type': 'Offer', priceCurrency: 'AED', price: rentFrom(p).price, availability: 'https://schema.org/InStock', url: SITE.origin + productUrl(p), businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut' }
    : { '@type': 'Offer', priceCurrency: 'AED', price: p.sale.price, availability: 'https://schema.org/InStock', url: SITE.origin + productUrl(p) };
  const body = `
<section style="padding-top:34px"><div class="container">
  <p class="breadcrumb"><a href="/">Home</a> · <a href="${parent[1]}">${parent[0]}</a> · <a href="${catUrl(c)}">${esc(c.name)}</a></p>
  <div class="pdp">
    <div class="pdp-media">${icon(c.icon)}<span class="ph-note">Photo coming soon</span></div>
    <div>
      <h1>${esc(p.name)}</h1>
      <p class="lead">${esc(p.summary)}</p>
      <ul class="pdp-feat">${(p.features || []).map((f) => `<li>${check}<span>${esc(f)}</span></li>`).join('')}</ul>
      <div class="buybox" data-buybox>
        <script type="application/json" data-product>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
        ${box}
      </div>
    </div>
  </div>
</div></section>
${related.length ? `<section class="bg-soft"><div class="container"><div class="section-head"><h2>More ${esc(c.name.toLowerCase())}</h2></div><div class="models">${related.map(productCard).join('')}</div></div></section>` : ''}`;
  return page({
    path: productUrl(p),
    title: `${p.name} ${isRent ? 'rental' : 'for sale'} in Dubai, ${pl.main} | ${SITE.name}`,
    description: `${p.summary} ${pl.main} ${pl.sub}. Pay on delivery.`,
    body,
    waText: `Hello, I am interested in: ${p.name}`,
    jsonld: [breadcrumbLd([['Home', '/'], parent, [c.name, catUrl(c)], [p.name, productUrl(p)]]),
      { '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: p.summary, category: c.name, offers: offer }],
  });
}

export function notFound() {
  return page({
    path: '/404', title: `Page not found | ${SITE.name}`, description: 'Page not found.', noindex: true,
    body: `<section class="page-hero"><div class="container"><h1>Page not found</h1><p class="lead">The page moved or no longer exists.</p></div></section>
<section style="padding-top:28px"><div class="container">${tiles(rentCats().slice(0, 8), 'p')}<p style="margin-top:22px"><a class="btn btn-primary" href="/">Home</a></p></div></section>`,
  });
}

export function cart() {
  const emirates = SITE.emirates.map((e) => `<option>${e}</option>`).join('');
  const body = `<section class="page-hero"><div class="container"><h1>Your cart</h1><p class="lead">Send the order request. We confirm availability and the delivery fee on WhatsApp, you pay on delivery.</p></div></section>
<section style="padding-top:28px"><div class="container cart-wrap">
  <div>
    <div class="cart-lines" data-cart-lines><div class="cart-empty"><p>Your cart is empty.</p><p><a class="btn btn-primary" href="/rent">Rent equipment</a></p></div></div>
    <div class="cart-total" data-cart-total hidden><span>Estimated total</span><b data-cart-sum></b></div>
  </div>
  <form class="order-form" data-order-form novalidate>
    <h2>Order request</h2>
    <label for="o-name">Full name</label><input id="o-name" name="name" autocomplete="name" required>
    <label for="o-phone">Mobile number (WhatsApp)</label><input id="o-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+971" required>
    <label for="o-emirate">Emirate</label><select id="o-emirate" name="emirate" required>${emirates}</select>
    <label for="o-area">Area</label><input id="o-area" name="area" placeholder="e.g. Dubai Marina" required>
    <label for="o-address">Building and flat, or hospital (optional)</label><input id="o-address" name="address" autocomplete="street-address">
    <label for="o-pay">Payment on delivery</label><select id="o-pay" name="payment"><option>Card on delivery</option><option>Cash on delivery</option></select>
    <label for="o-note">Note (optional)</label><textarea id="o-note" name="note" rows="3" maxlength="400"></textarea>
    <div class="hp" aria-hidden="true"><label for="o-web">Website</label><input id="o-web" name="web" tabindex="-1" autocomplete="off"></div>
    <button class="btn btn-wa" type="submit">${icon('message-circle')}Send order request</button>
    <p class="err" data-order-err role="alert" hidden></p>
    <p class="fine">Nothing is charged now. We only use your details to handle this order. <a href="/privacy">Privacy</a></p>
  </form>
</div></section>`;
  return page({ path: '/cart', title: `Cart | ${SITE.name}`, description: 'Your cart and order request. Nothing is charged online; we confirm on WhatsApp and you pay on delivery.', body, noindex: true });
}
