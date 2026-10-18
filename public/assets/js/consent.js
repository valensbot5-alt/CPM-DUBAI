/* CPM Rent Dubai: opt-in cookie consent and PostHog (EU, project 191591).
   Without consent PostHog is never loaded. ?interni=1 marks the owner's device (never counted), ?interni=0 undoes it. */
(function () {
  'use strict';

  var PH_KEY = 'phc_xqBeS6T9ou6pq5GtUvLeQT8D3MU9jZVwa47bv5cMqcYv'; // public project key, as PostHog intends
  var PH_HOST = 'https://eu.i.posthog.com';
  var KEY = 'cpmd_consent_v1';
  var INTERNAL = 'cpmd_internal';
  var DAYS = 180;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }

  // ?interni=1 / ?interni=0, then clean the address bar
  var m = /[?&]interni=([01])/.exec(location.search);
  if (m) {
    set(INTERNAL, m[1]);
    try { history.replaceState(null, '', location.pathname + location.search.replace(/[?&]interni=[01]/, '').replace(/^&/, '?') + location.hash); } catch (e) { /* ignore */ }
  }

  function choice() {
    try {
      var o = JSON.parse(get(KEY) || 'null');
      return o && Date.now() - o.ts <= DAYS * 864e5 ? o.v : null;
    } catch (e) { return null; }
  }

  var loaded = false;
  function loadPostHog() {
    if (loaded || get(INTERNAL) === '1') return;
    loaded = true;
    /* official PostHog loader snippet */
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset identify alias people.set people.set_once set_config get_distinct_id get_property".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(PH_KEY, { api_host: PH_HOST, person_profiles: 'identified_only' });
  }

  function banner() {
    var css = document.createElement('style');
    css.textContent =
      '.ck-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;background:#fff;border:1px solid #d8dee5;border-radius:12px;' +
      'box-shadow:0 8px 28px rgba(0,0,0,.16);padding:18px 20px;max-width:560px;margin:0 auto;font-size:15px;line-height:1.5;color:var(--navy)}' +
      '.ck-consent p{margin:0 0 14px}.ck-consent a{color:var(--brand-dark);text-decoration:underline}' +
      '.ck-btns{display:flex;gap:10px;flex-wrap:wrap}.ck-consent button{flex:1 1 auto;min-height:48px;padding:12px 18px;border-radius:8px;font:inherit;' +
      'font-weight:600;cursor:pointer;border:1px solid #c3ccd6;background:#f4f6f8;color:var(--navy)}' +
      '.ck-consent button.ck-yes{background:var(--brand-dark);border-color:var(--brand-dark);color:#fff}' +
      'body:has(.mob-traka.vidljiva) .ck-consent{bottom:calc(84px + env(safe-area-inset-bottom))}';
    document.head.appendChild(css);
    var box = document.createElement('div');
    box.className = 'ck-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie consent');
    box.innerHTML = '<p>We use analytics cookies to see what visitors need on this site. Nothing is measured without your consent. <a href="/privacy">Privacy</a></p>' +
      '<div class="ck-btns"><button type="button" class="ck-yes">Accept</button><button type="button" class="ck-no">Decline</button></div>';
    function close() { if (box.parentNode) box.parentNode.removeChild(box); }
    box.querySelector('.ck-yes').addEventListener('click', function () { set(KEY, JSON.stringify({ v: 'yes', ts: Date.now() })); loadPostHog(); close(); });
    box.querySelector('.ck-no').addEventListener('click', function () { set(KEY, JSON.stringify({ v: 'no', ts: Date.now() })); close(); });
    document.body.appendChild(box);
  }

  var c = choice();
  if (c === 'yes') loadPostHog();
  else if (c === null) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
  }
})();
