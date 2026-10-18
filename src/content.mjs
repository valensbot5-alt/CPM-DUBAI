// Information pages, emirate pages and the recovery blog.
import fs from 'node:fs';
import path from 'node:path';
import { SITE, catalog, icon, esc, aed, waLink, catUrl } from './site.mjs';
import { page, breadcrumbLd, faqLd, faqHtml, answerBox } from './layout.mjs';
import { productCard } from './pages.mjs';

function infoPage(p, title, lead, html, extra = {}) {
  return page({
    path: p,
    title: `${title} | ${SITE.name}`,
    description: extra.description || lead,
    body: `<section class="page-hero"><div class="container"><h1>${esc(title)}</h1><p class="lead">${esc(lead)}</p></div></section>
<section class="article"><div class="container prose">${html}</div></section>${extra.after || ''}`,
    jsonld: [breadcrumbLd([['Home', '/'], [title, p]]), ...(extra.jsonld || [])],
  });
}

const wa = (t) => `<a href="${waLink(t)}" target="_blank" rel="noopener">WhatsApp</a>`;

export function delivery() {
  return infoPage('/delivery', 'Delivery and collection', 'How delivery, setup and collection work, and how the delivery fee is set.', `
<h2>How delivery works</h2>
<ul>
  <li>You send the order request from the cart, or message us on ${wa('Hello, I have a question about delivery.')}.</li>
  <li>We reply with availability, the delivery time and the delivery fee for your address. Nothing is charged before you agree.</li>
  <li>We deliver to your home, a hotel or a hospital. Beds, lifters and CPM machines are set up and explained at delivery.</li>
  <li>You pay on delivery, by card or in cash.</li>
</ul>
<h2>Where we deliver</h2>
<p>Dubai, and the other emirates on request: ${SITE.emirates.slice(1).join(', ')}. The delivery time and fee depend on the address and are confirmed before you pay.</p>
<h2>Collection of rentals</h2>
<p>Message us before the end date to arrange collection, or to extend the rental. Extensions use the same rates if the unit is free.</p>
<h2>What to have ready</h2>
<ul><li>A copy of your Emirates ID or passport for rentals.</li><li>Someone at the address at the agreed time.</li><li>For oxygen, CPAP, BiPAP, ventilators and feeding pumps: the settings your doctor prescribed.</li></ul>`);
}

export function rentalTerms() {
  return infoPage('/rental-terms', 'Rental terms', 'One set of rules for every rental, in plain language.', `
<h2>Rental period and price</h2>
<p>The rental period is counted in days from the delivery date to the collection date. The price for your dates is shown on the product page before you order. Some equipment is rented in packages (for example up to 7, 14 or 30 days), so a shorter rental pays the package price.</p>
<h2>Payment</h2>
<p>You pay on delivery, by card or in cash. Extensions are paid when they start.</p>
<h2>Deposit</h2>
<p>If a deposit applies to your equipment, the amount is confirmed in writing before delivery and refunded when the equipment comes back in working order.</p>
<h2>Identification</h2>
<p>A copy of the Emirates ID or passport of the person renting is required at delivery.</p>
<h2>Extension and early return</h2>
<p>Message us at least one day before the end date to extend. Early returns are welcome; the price is recalculated for the days used, but never below the shortest package for that equipment.</p>
<h2>Care of the equipment</h2>
<p>Use the equipment as shown at delivery and keep it indoors and dry. Tell us straight away if something does not work: we repair or replace it. Damage beyond normal use, or loss, is charged at repair or replacement cost, which we show you before charging.</p>
<h2>Cancellation</h2>
<p>Nothing is paid before delivery, so you can cancel an order request at any time before the equipment leaves us, free of charge.</p>
<h2>Medical use</h2>
<p>We supply equipment, not medical advice. Use it as your doctor or physiotherapist instructed.</p>`);
}

export function returns() {
  return infoPage('/returns', 'Returns', 'Returns for equipment you buy.', `
<h2>Before you pay</h2>
<p>You pay on delivery, so you can check the equipment at the door. If it is damaged or not what you ordered, do not accept it and we replace it.</p>
<h2>After delivery</h2>
<p>Unused equipment in its original packaging can be returned within 7 days of delivery. Message us on ${wa('Hello, I would like to return an item.')} with the order details and we arrange collection. For hygiene reasons, used items that touch the body (masks, garments, cushions, mattresses that have been used) cannot be returned unless they are faulty.</p>
<h2>Faulty equipment</h2>
<p>If equipment you bought stops working, message us. We arrange repair or replacement under the manufacturer's warranty.</p>`);
}

const FAQ = [
  ['Do I pay online?', 'No. You send an order request, we confirm availability and the delivery fee on WhatsApp, and you pay on delivery in cash or by card.'],
  ['How is the rental price calculated?', 'Each item has a daily rate or package rates (for example up to 7, 14 or 30 days). For your dates we always charge the cheapest combination of these rates. The product page shows the total before you order.'],
  ['What is the shortest rental?', 'One day for most equipment. Beds, lifters, oxygen, CPAP and BiPAP are rented in packages, so a short rental pays the package price.'],
  ['Can I extend the rental?', 'Yes. Message us at least one day before the end date and we extend at the same rates if the unit is free.'],
  ['Do you deliver outside Dubai?', 'Yes, on request. The delivery time and fee for other emirates are confirmed before you pay.'],
  ['Do I need a prescription?', 'Not for mobility aids, beds or CPM machines. Oxygen, CPAP, BiPAP, ventilators and feeding pumps are set to the settings your doctor prescribed.'],
  ['What do I need at delivery?', 'A copy of your Emirates ID or passport for rentals, and payment by card or cash.'],
  ['Is the equipment cleaned?', 'Yes. Every rental item is cleaned and disinfected before delivery.'],
  ['Can I buy instead of renting?', 'Yes. If you need equipment for many months, buying is often cheaper. See the Buy section or ask us to compare.'],
];

export function faq() {
  return infoPage('/faq', 'Frequently asked questions', 'Ordering, prices, delivery and rental rules.', faqHtml(FAQ), { jsonld: [faqLd(FAQ)] });
}

export function contact() {
  return infoPage('/contact', 'Contact', 'The fastest way to reach us is WhatsApp. A person replies.', `
<p><a class="btn btn-wa" href="${waLink(`Hello ${SITE.name}`)}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp ${esc(SITE.phoneDisplay)}</a></p>
<ul>
  <li>Phone: <a href="tel:${SITE.phone}">${esc(SITE.phoneDisplay)}</a></li>
  <li>Email: <a href="mailto:${SITE.email}">${SITE.email}</a></li>
  <li>Service area: Dubai, other emirates on request</li>
</ul>
<p>For an order, the quickest route is the <a href="/cart">cart</a>: you get a reply on WhatsApp with availability and the delivery fee.</p>`);
}

export function privacy() {
  return infoPage('/privacy', 'Privacy policy', 'What we collect, why, and your rights under UAE law.', `
<p>Last updated: 18 October 2026</p>
<h2>1. Who we are</h2>
<p>${SITE.name} rents and sells medical equipment in the United Arab Emirates. Contact for privacy questions: WhatsApp ${esc(SITE.phoneDisplay)} or ${SITE.email}.</p>
<h2>2. What we collect</h2>
<ul>
  <li>Name, mobile number, emirate, area and address, to confirm and deliver your order.</li>
  <li>The equipment, dates and notes you enter in the order request.</li>
  <li>If you accept analytics cookies: anonymous usage data (pages viewed, clicks) to improve the site.</li>
</ul>
<p>We do not collect card details. Payment is made on delivery.</p>
<h2>3. How we use it</h2>
<p>Only to handle your order: availability, delivery, collection, extensions and support. No profiling, no automated decisions, no unrelated marketing.</p>
<h2>4. Who processes it</h2>
<ul>
  <li>Telegram: order requests from the website are delivered to our team as a Telegram message.</li>
  <li>WhatsApp (Meta): when you message us there, WhatsApp's own privacy policy also applies.</li>
  <li>PostHog (EU servers): website analytics, only after you accept cookies.</li>
  <li>Our delivery team, only what is needed for delivery. UAE authorities, if required by law.</li>
</ul>
<p>We never sell or rent your data.</p>
<h2>5. How long we keep it</h2>
<p>Order details are kept for up to 2 years after the order, for support, disputes and record keeping.</p>
<h2>6. Your rights (UAE PDPL)</h2>
<p>Under Federal Decree Law No. 45 of 2021 you can ask for access, correction or deletion of your data, and withdraw consent for analytics at any time. Contact us and we reply within 30 days.</p>
<h2>7. Changes</h2>
<p>We update this page when our practice changes; the date at the top shows the latest version.</p>`);
}

const EMIRATES = [
  ['dubai', 'Dubai', 'Dubai Marina, JLT, Downtown, Business Bay, Jumeirah, Al Barsha, Mirdif and the rest of Dubai'],
  ['abu-dhabi', 'Abu Dhabi', 'Abu Dhabi city, Khalifa City, Yas, Saadiyat and Al Reem, on request'],
  ['sharjah', 'Sharjah', 'Sharjah city and Al Nahda border areas, on request'],
  ['ajman', 'Ajman', 'Ajman city, on request'],
  ['al-ain', 'Al Ain', 'Al Ain city, on request'],
];

export function emirates() {
  const popular = ['cpm-machine-knee-hip', 'hospital-bed-electric', 'wheelchair-lightweight-aluminium', 'oxygen-concentrator']
    .map((s) => catalog.bySlug.get(s));
  return EMIRATES.map(([slug, name, areas]) => [`/${slug}`, page({
    path: `/${slug}`,
    title: `Medical Equipment Rental in ${name} | ${SITE.name}`,
    description: `Rent or buy hospital beds, wheelchairs, CPM machines and oxygen in ${name}. Pay on delivery, delivery fee confirmed before you pay.`,
    body: `<section class="page-hero"><div class="container"><h1>Medical equipment rental in ${esc(name)}</h1>
<p class="lead">Hospital beds, wheelchairs, CPM machines, oxygen and more, delivered in ${esc(name)}. Choose online, we confirm on WhatsApp, you pay on delivery.</p></div></section>
<section class="article"><div class="container">
${answerBox(`We deliver rental and purchased medical equipment in ${esc(name)}. You choose online and send an order request; we confirm availability, delivery time and the delivery fee on WhatsApp before anything is charged, and you pay on delivery.`,
    [`Areas: ${esc(areas)}`, 'Rent from one day, extend by message', 'Pay on delivery, card or cash', 'Copy of Emirates ID or passport at delivery'])}
</div></section>
<section class="bg-soft"><div class="container"><div class="section-head"><h2>Popular in ${esc(name)}</h2></div><div class="models">${popular.map(productCard).join('')}</div>
<p style="margin-top:22px"><a class="btn btn-primary" href="/rent">All rentals</a> <a class="btn btn-ghost" href="/buy">Buy equipment</a></p></div></section>`,
    jsonld: [breadcrumbLd([['Home', '/'], [name, `/${slug}`]])],
  })]);
}

// ---------- blog: articles live in blog/*.html (old design); we keep the article body and URL.
const BLOG_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'blog');

function cleanArticle(html) {
  return html
    .replace(/KneeCare Dubai Medical Team/g, SITE.name)
    .replace(/KneeCare Dubai/g, SITE.name)
    .replace(/KneeCare/g, SITE.name)
    .replace(/\s(style|onclick|onmouseover|onmouseout)="[^"]*"/g, '')
    .replace(/<nav class="toc">/g, '<nav class="blog-toc">')
    .replace(/<table>/g, '<div class="price-table"><table>').replace(/<\/table>/g, '</table></div>')
    .replace(/https:\/\/cpmrentdubai\.com\/blog\/([a-z0-9-]+)\.html/g, '/blog/$1')
    .replace(/href="\/blog\/([a-z0-9-]+)\.html/g, 'href="/blog/$1')
    // house style: no dashes as separators; numeric ranges read "4 to 6"
    .replace(/(\d)\s*[–—]\s*(\d)/g, '$1 to $2')
    .replace(/\s*[–—]\s*/g, ', ');
}

export function blog() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.html')).sort();
  const posts = files.map((f) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, f), 'utf8');
    const slug = f.replace(/\.html$/, '');
    const title = (raw.match(/<title>([\s\S]*?)<\/title>/) || [])[1].replace(/\s*\|.*$/, '').trim();
    const description = ((raw.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '').trim();
    const art = (raw.match(/<article[^>]*>([\s\S]*?)<\/article>/) || [])[1] || '';
    const body = cleanArticle(art.replace(/<script[\s\S]*?<\/script>/g, ''));
    return { slug, title, description, body };
  });
  const out = posts.map((p) => [`/blog/${p.slug}`, page({
    path: `/blog/${p.slug}`,
    title: `${p.title} | ${SITE.name}`,
    description: p.description,
    body: `<section class="article" style="padding-top:34px"><div class="container prose">
<p class="mrvice"><a href="/">Home</a> · <a href="/blog">Recovery blog</a></p>
${p.body}
<div class="blog-cta"><p><strong>Need a CPM machine or other recovery equipment?</strong> Rent from one day, pay on delivery.</p>
<div class="hero-cta"><a class="btn btn-primary" href="/rent/cpm">CPM machine rental</a><a class="btn btn-wa" href="${waLink('Hello, I read your blog and have a question.')}" target="_blank" rel="noopener">${icon('message-circle')}WhatsApp</a></div></div>
</div></section>`,
    jsonld: [breadcrumbLd([['Home', '/'], ['Recovery blog', '/blog'], [p.title, `/blog/${p.slug}`]]),
      { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, description: p.description, publisher: { '@type': 'Organization', name: SITE.name } }],
  })]);
  out.push(['/blog', page({
    path: '/blog',
    title: `Knee Surgery Recovery Blog | ${SITE.name}`,
    description: 'Guides on CPM machines, knee replacement recovery, exercises, nutrition and sleep after surgery.',
    body: `<section class="page-hero"><div class="container"><h1>Recovery blog</h1><p class="lead">Guides on CPM machines and recovery after knee surgery.</p></div></section>
<section class="article"><div class="container prose"><div class="blog-lista">${posts.map((p) => `<a class="blog-kartica" href="/blog/${p.slug}"><h2>${esc(p.title)}</h2><p>${esc(p.description)}</p></a>`).join('')}</div></div></section>`,
    jsonld: [breadcrumbLd([['Home', '/'], ['Recovery blog', '/blog']])],
  })]);
  return out;
}
