/* ------------------------------------------------------------------ *
 *  Stargazing Atlas generator
 *  Scans every post that has a `location: [lat, lng]` front-matter
 *  field and builds three pages plus a data file, with no external
 *  map API key required (Leaflet + free CARTO dark tiles).
 *
 *  Outputs:
 *    /                 -> night map of Singapore + contact form
 *    /sites/           -> filterable list of all sites
 *    /sites-data.json  -> the raw site data (handy if you want it)
 *    /stargazing.css   -> shared stylesheet for these pages + /about/
 *
 *  Per-post front-matter it understands (all optional except location):
 *    location: [1.3445, 103.6339]      # required to appear on the map
 *    image: /images/sites/raffles.jpg  # one photo for the popup/card
 *    region: West                      # used by the Sites filter
 *    darkness: 3/3                      # used by the Sites filter
 *    summary:                          # the few key fields shown on the pin
 *      Darkness: 3/3
 *      Dark regions: West
 *      Toilet: Yes
 *      Transport: 10 min walk from Tuas Link MRT
 * ------------------------------------------------------------------ */

'use strict';

// >>> CONFIG: paste your Formspree endpoint here (see setup notes). <<<
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

hexo.extend.generator.register('stargazing_atlas', function (locals) {
  const posts = locals.posts.sort('-date').toArray();

  const sites = posts
    .filter(p => Array.isArray(p.location) && p.location.length === 2)
    .map(p => ({
      name: p.title || 'Untitled site',
      url: encodeURI('/' + p.path),
      lat: Number(p.location[0]),
      lng: Number(p.location[1]),
      image: p.image || null,
      region: p.region || (p.summary && p.summary.Region) || null,
      darkness: p.darkness || (p.summary && p.summary.Darkness) || null,
      summary: (p.summary && typeof p.summary === 'object') ? p.summary : {}
    }))
    .filter(s => isFinite(s.lat) && isFinite(s.lng));

  const dataScript =
    '<script>var SITES = ' + JSON.stringify(sites) + ';</script>';

  return [
    { path: 'sites-data.json', data: JSON.stringify(sites, null, 2) }
  ];
});

/* ----------------------------- shared --------------------------------- */

function head(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&amp;family=Inter:wght@400;500;600&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<link rel="stylesheet" href="/stargazing.css">
</head>`;
}

function nav(active) {
  const item = (href, label, key) =>
    `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header class="topbar">
  <a class="brand" href="/"><span class="brand-mark">&#10022;</span> Stargazing Sites <em>&middot; Singapore</em></a>
  <nav class="nav">
    ${item('/', 'Map', 'map')}
    ${item('/sites/', 'Sites', 'sites')}
    ${item('/about/', 'About', 'about')}
  </nav>
</header>`;
}

function foot() {
  return `<footer class="foot">
  <p>A slow but ongoing compilation of stargazing sites in Singapore.
     Want to contribute a site? Use the form above.</p>
</footer>`;
}

/* ------------------------------ home ---------------------------------- */

function homePage(dataScript) {
  return `${head('Stargazing Sites')}
<body class="page-map">Re 
${nav('map')}

<section class="hero">
  <p class="eyebrow">I'm the Map, I'm the Map</p>
  <div id="map" class="map" role="application" aria-label="Map of stargazing sites in Singapore"></div>
  <p class="map-hint">Tap a site to see conditions and link to full information.</p>
</section>

<section class="contact" id="ask">
  <div class="contact-inner">
    <h2>Contact Me</h2>
    <p class="lede">Any site updates, site recommendations, etc? Send a message &mdash; No promises to reply.</p>
    <form id="ask-form" class="ask-form" novalidate>
      <div class="field">
        <label for="f-name">Name</label>
        <input id="f-name" name="name" autocomplete="name" required>
      </div>
      <div class="field">
        <label for="f-email">Email</label>
        <input id="f-email" name="email" type="email" autocomplete="email" required>
      </div>
      <div class="field">
        <label for="f-topic">Topic</label>
        <input id="f-topic" name="topic" required>
      </div>
      <div class="field field-wide">
        <label for="f-msg">Message</label>
        <textarea id="f-msg" name="message" rows="5" required></textarea>
      </div>
      <div class="field-wide form-row">
        <button type="submit">Send message</button>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
      </div>
    </form>
  </div>
</section>

${foot()}

${dataScript}
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var SG = [1.3521, 103.8198];
  var map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView(SG, 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd', maxZoom: 19
  }).addTo(map);

  var starIcon = L.divIcon({
    className: 'star-pin',
    html: '<span class="star-dot"></span>',
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -9]
  });

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = (t == null) ? '' : String(t);
    return d.innerHTML;
  }

  function popupHtml(s) {
    var img = s.image
      ? '<a class="pop-img" href="' + s.url + '"><img src="' + esc(s.image) + '" alt="' + esc(s.name) + '" loading="lazy"></a>'
      : '';
    var rows = '';
    Object.keys(s.summary || {}).slice(0, 4).forEach(function (k) {
      rows += '<dt>' + esc(k) + '</dt><dd>' + esc(s.summary[k]) + '</dd>';
    });
    var dl = rows ? '<dl class="pop-summary">' + rows + '</dl>' : '';
    return '<div class="pop">' + img +
      '<a class="pop-title" href="' + s.url + '">' + esc(s.name) + '</a>' + dl + '</div>';
  }

  var pts = [];
  SITES.forEach(function (s) {
    if (typeof s.lat !== 'number' || typeof s.lng !== 'number') return;
    L.marker([s.lat, s.lng], { icon: starIcon, title: s.name })
      .addTo(map)
      .bindPopup(popupHtml(s), { className: 'sky-popup', maxWidth: 260 });
    pts.push([s.lat, s.lng]);
  });
  if (pts.length > 1) map.fitBounds(pts, { padding: [44, 44], maxZoom: 13 });
})();
</script>
<script>
(function () {
  var ENDPOINT = '${FORMSPREE_ENDPOINT}';
  var form = document.getElementById('ask-form');
  var status = document.getElementById('form-status');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (ENDPOINT.indexOf('YOUR_FORM_ID') !== -1) {
      status.textContent = 'Form isn\\'t connected yet \u2014 add your Formspree ID in scripts/generate-stargazing.js.';
      status.className = 'form-status err';
      return;
    }
    status.textContent = 'Sending\\u2026';
    status.className = 'form-status';
    fetch(ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (r) {
      if (r.ok) {
        form.reset();
        status.textContent = 'Thanks \u2014 your message is on its way.';
        status.className = 'form-status ok';
      } else {
        return r.json().then(function (d) {
          throw new Error((d.errors && d.errors[0] && d.errors[0].message) || 'Something went wrong.');
        });
      }
    }).catch(function (err) {
      status.textContent = err.message || 'Could not send right now. Please try again later.';
      status.className = 'form-status err';
    });
  });
})();
</script>
</body>
</html>`;
}

/* ------------------------------ sites --------------------------------- */

function sitesPage(dataScript) {
  return `${head('All sites \u00B7 Stargazing Sites')}
<body class="page-sites">
${nav('sites')}

<section class="sites-head">
  <h1>Every site</h1>
  <p class="lede">Filter by region or darkness, or search by name.</p>
  <div class="filters">
    <input id="q" class="search" type="search" placeholder="Search sites&hellip;" aria-label="Search sites">
    <select id="f-region" aria-label="Filter by region"></select>
    <select id="f-dark" aria-label="Filter by darkness"></select>
    <button id="reset" class="ghost" type="button">Clear</button>
  </div>
</section>

<main class="grid" id="grid"></main>
<p class="empty" id="empty" hidden>No sites match those filters yet.</p>

${foot()}

${dataScript}
<script>
(function () {
  var grid = document.getElementById('grid');
  var empty = document.getElementById('empty');
  var q = document.getElementById('q');
  var fRegion = document.getElementById('f-region');
  var fDark = document.getElementById('f-dark');
  var reset = document.getElementById('reset');

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = (t == null) ? '' : String(t);
    return d.innerHTML;
  }
  function uniq(key) {
    var seen = {};
    SITES.forEach(function (s) { if (s[key]) seen[s[key]] = true; });
    return Object.keys(seen).sort();
  }
  function fillSelect(sel, label, values) {
    sel.innerHTML = '<option value="">' + label + '</option>' +
      values.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
  }
  fillSelect(fRegion, 'All regions', uniq('region'));
  fillSelect(fDark, 'All darkness', uniq('darkness'));

  function card(s) {
    var thumb = s.image
      ? '<a class="card-img" href="' + s.url + '"><img src="' + esc(s.image) + '" alt="' + esc(s.name) + '" loading="lazy"></a>'
      : '<a class="card-img card-img--none" href="' + s.url + '"><span>No photo yet</span></a>';
    var chips = '';
    if (s.region) chips += '<span class="chip">' + esc(s.region) + '</span>';
    if (s.darkness) chips += '<span class="chip chip--dark">Darkness ' + esc(s.darkness) + '</span>';
    var extra = Object.keys(s.summary || {})
      .filter(function (k) { return k !== 'Region' && k !== 'Darkness'; })
      .slice(0, 2)
      .map(function (k) { return '<li><b>' + esc(k) + '</b> ' + esc(s.summary[k]) + '</li>'; })
      .join('');
    return '<article class="card">' + thumb +
      '<div class="card-body">' +
        '<h2><a href="' + s.url + '">' + esc(s.name) + '</a></h2>' +
        (chips ? '<div class="chips">' + chips + '</div>' : '') +
        (extra ? '<ul class="card-meta">' + extra + '</ul>' : '') +
      '</div></article>';
  }

  function apply() {
    var term = q.value.trim().toLowerCase();
    var reg = fRegion.value;
    var dark = fDark.value;
    var shown = SITES.filter(function (s) {
      if (reg && s.region !== reg) return false;
      if (dark && s.darkness !== dark) return false;
      if (term && s.name.toLowerCase().indexOf(term) === -1) return false;
      return true;
    });
    grid.innerHTML = shown.map(card).join('');
    empty.hidden = shown.length !== 0;
  }

  [q, fRegion, fDark].forEach(function (el) {
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });
  reset.addEventListener('click', function () {
    q.value = ''; fRegion.value = ''; fDark.value = ''; apply();
  });
  apply();
})();
</script>
</body>
</html>`;
}

/* ------------------------------ styles -------------------------------- */

const STYLES = `:root{
  --ink:#0a0e22; --ink-2:#0f1530; --ink-3:#161d3d;
  --line:rgba(180,195,255,.12);
  --text:#e9ecfb; --muted:#9aa6cf;
  --amber:#f4b860; --star:#9cc1ff;
  --shadow:0 14px 44px rgba(0,0,0,.5);
}
*{box-sizing:border-box}
html,body{margin:0}
body{
  background:var(--ink); color:var(--text);
  font-family:Inter,system-ui,sans-serif; line-height:1.55;
  -webkit-font-smoothing:antialiased;
}
a{color:var(--star); text-decoration:none}
a:hover{text-decoration:underline}

/* top bar */
.topbar{
  display:flex; align-items:center; justify-content:space-between;
  gap:1rem; padding:.9rem clamp(1rem,4vw,2.4rem);
  border-bottom:1px solid var(--line);
  background:linear-gradient(180deg,rgba(15,21,48,.92),rgba(10,14,34,.92));
  position:sticky; top:0; z-index:1000; backdrop-filter:blur(8px);
}
.brand{
  font-family:Fraunces,serif; font-weight:600; font-size:1.18rem;
  color:var(--text); letter-spacing:.2px;
}
.brand:hover{text-decoration:none}
.brand em{color:var(--muted); font-style:normal; font-weight:400}
.brand-mark{color:var(--amber); margin-right:.15rem}
.nav{display:flex; gap:.4rem}
.nav a{
  color:var(--muted); padding:.4rem .7rem; border-radius:8px;
  font-size:.95rem; font-weight:500;
}
.nav a:hover{color:var(--text); background:var(--ink-3); text-decoration:none}
.nav a[aria-current="page"]{color:var(--ink); background:var(--amber)}

/* hero / map */
.hero{padding:clamp(1rem,3vw,2rem) clamp(1rem,4vw,2.4rem) .5rem}
.eyebrow{
  font-family:"Space Mono",monospace; text-transform:uppercase;
  letter-spacing:.22em; font-size:.72rem; color:var(--amber);
  margin:.2rem 0 1rem;
}
.map{
  height:min(74vh,720px); width:100%;
  border:1px solid var(--line); border-radius:18px;
  box-shadow:var(--shadow); background:var(--ink-2);
}
.map-hint{color:var(--muted); font-size:.9rem; margin:.8rem 2px 0}

/* glowing pins */
.star-pin .star-dot{
  display:block; width:11px; height:11px; margin:4px auto; border-radius:50%;
  background:var(--amber);
  box-shadow:0 0 0 2px rgba(244,184,96,.22), 0 0 12px 3px rgba(244,184,96,.7);
  animation:twinkle 3.4s ease-in-out infinite;
}
@keyframes twinkle{0%,100%{opacity:1}50%{opacity:.55}}

/* leaflet popup, dark theme */
.sky-popup .leaflet-popup-content-wrapper{
  background:var(--ink-3); color:var(--text);
  border:1px solid var(--line); border-radius:14px; box-shadow:var(--shadow);
}
.sky-popup .leaflet-popup-content{margin:0; width:230px!important}
.sky-popup .leaflet-popup-tip{background:var(--ink-3); border:1px solid var(--line)}
.sky-popup a.leaflet-popup-close-button{color:var(--muted); padding:6px 8px 0 0}
.pop-img{display:block}
.pop-img img{width:100%; height:130px; object-fit:cover; display:block;
  border-radius:14px 14px 0 0}
.pop-title{
  display:block; font-family:Fraunces,serif; font-weight:600; font-size:1.05rem;
  color:var(--text); padding:.7rem .85rem .2rem;
}
.pop-summary{margin:.2rem .85rem .85rem; display:grid; grid-template-columns:auto 1fr;
  gap:.15rem .6rem; font-size:.82rem}
.pop-summary dt{color:var(--muted)}
.pop-summary dd{margin:0}

/* contact */
.contact{padding:clamp(2rem,5vw,3.5rem) clamp(1rem,4vw,2.4rem)}
.contact-inner{max-width:680px; margin:0 auto}
.contact h2{font-family:Fraunces,serif; font-weight:600; font-size:1.7rem; margin:0 0 .3rem}
.lede{color:var(--muted); margin:.2rem 0 1.4rem}
.ask-form{display:grid; grid-template-columns:1fr 1fr; gap:1rem}
.field{display:flex; flex-direction:column; gap:.35rem}
.field-wide{grid-column:1 / -1}
.ask-form label{font-size:.82rem; color:var(--muted);
  font-family:"Space Mono",monospace; letter-spacing:.04em}
.ask-form input,.ask-form textarea{
  background:var(--ink-2); border:1px solid var(--line); border-radius:10px;
  color:var(--text); padding:.7rem .8rem; font:inherit; resize:vertical;
}
.ask-form input:focus,.ask-form textarea:focus{
  outline:none; border-color:var(--star); box-shadow:0 0 0 3px rgba(156,193,255,.18)
}
.form-row{display:flex; align-items:center; gap:1rem; flex-wrap:wrap}
.ask-form button{
  background:var(--amber); color:#1a1300; border:0; border-radius:10px;
  padding:.7rem 1.3rem; font-weight:600; font-size:.95rem; cursor:pointer;
}
.ask-form button:hover{filter:brightness(1.06)}
.form-status{margin:0; font-size:.9rem; color:var(--muted)}
.form-status.ok{color:#86e0b0}
.form-status.err{color:#ff9c9c}

/* sites page */
.sites-head{padding:clamp(1.4rem,4vw,2.4rem) clamp(1rem,4vw,2.4rem) 0}
.sites-head h1{font-family:Fraunces,serif; font-weight:700; font-size:2rem; margin:.2rem 0}
.filters{display:flex; gap:.7rem; flex-wrap:wrap; margin:1.1rem 0 .4rem}
.search,.filters select{
  background:var(--ink-2); border:1px solid var(--line); border-radius:10px;
  color:var(--text); padding:.6rem .8rem; font:inherit;
}
.search{min-width:240px; flex:1}
.filters select{color:var(--text)}
.filters option{background:var(--ink-2)}
.ghost{background:transparent; border:1px solid var(--line); color:var(--muted);
  border-radius:10px; padding:.6rem 1rem; cursor:pointer; font:inherit}
.ghost:hover{color:var(--text); border-color:var(--star)}
.grid{
  display:grid; gap:1.2rem; padding:1.4rem clamp(1rem,4vw,2.4rem) 1rem;
  grid-template-columns:repeat(auto-fill,minmax(260px,1fr));
}
.card{
  background:var(--ink-2); border:1px solid var(--line); border-radius:16px;
  overflow:hidden; transition:transform .15s ease, border-color .15s ease;
}
.card:hover{transform:translateY(-3px); border-color:rgba(156,193,255,.4)}
.card-img{display:block; aspect-ratio:16/10; background:var(--ink-3)}
.card-img img{width:100%; height:100%; object-fit:cover; display:block}
.card-img--none{display:flex; align-items:center; justify-content:center}
.card-img--none span{color:var(--muted); font-size:.85rem;
  font-family:"Space Mono",monospace}
.card-body{padding:.9rem 1rem 1.1rem}
.card-body h2{font-family:Fraunces,serif; font-weight:600; font-size:1.15rem; margin:0}
.card-body h2 a{color:var(--text)}
.chips{display:flex; gap:.4rem; flex-wrap:wrap; margin:.55rem 0 0}
.chip{font-family:"Space Mono",monospace; font-size:.72rem; color:var(--muted);
  border:1px solid var(--line); border-radius:999px; padding:.18rem .6rem}
.chip--dark{color:var(--amber); border-color:rgba(244,184,96,.35)}
.card-meta{list-style:none; margin:.7rem 0 0; padding:0; font-size:.85rem; color:var(--muted)}
.card-meta b{color:var(--text); font-weight:500}
.empty{text-align:center; color:var(--muted); padding:2rem}

/* about */
.about-wrap{max-width:680px; margin:0 auto; padding:clamp(2rem,6vw,4rem) clamp(1rem,4vw,2.4rem)}
.about-wrap h1{font-family:Fraunces,serif; font-weight:700; font-size:2.2rem; margin:.2rem 0 1rem}
.about-wrap p{color:#c7cdec; margin:0 0 1rem}

/* footer */
.foot{border-top:1px solid var(--line); color:var(--muted);
  padding:2rem clamp(1rem,4vw,2.4rem); font-size:.9rem}
.foot a{color:var(--star)}
.foot p{max-width:680px; margin:0}

@media (max-width:560px){
  .ask-form{grid-template-columns:1fr}
  .brand em{display:none}
}
@media (prefers-reduced-motion:reduce){
  .star-pin .star-dot{animation:none}
  .card{transition:none}
}
`;
