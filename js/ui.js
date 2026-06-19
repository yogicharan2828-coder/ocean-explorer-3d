/* js/ui.js
   Handles: Navbar, HUD updates, Marine Life Grid, Creature Info Panel,
   Zone overlay, Sound toggle
*/
'use strict';

const OceanUI = (() => {

  /* ── ZONE CONFIG ── */
  const ZONES = [
    {
      id: 'sunlight',
      name: 'Sunlight Zone',
      depth: '0 – 200 m',
      maxDepth: 200,
      minDepth: 0,
      temp: '25°C → 15°C',
      pressure: '1 – 20 atm',
      color: '#00d4ff',
      bgTop: '#001428',
      bgBot: '#002d5c',
      creatures: ['dolphin', 'sea_turtle', 'great_white', 'blue_whale'],
    },
    {
      id: 'twilight',
      name: 'Twilight Zone',
      depth: '200 – 1,000 m',
      maxDepth: 1000,
      minDepth: 200,
      temp: '15°C → 4°C',
      pressure: '20 – 100 atm',
      color: '#7b6fff',
      bgTop: '#001040',
      bgBot: '#050025',
      creatures: ['lanternfish', 'jellyfish', 'giant_squid', 'swordfish'],
    },
    {
      id: 'midnight',
      name: 'Midnight Zone',
      depth: '1,000 – 4,000 m',
      maxDepth: 4000,
      minDepth: 1000,
      temp: '4°C → 2°C',
      pressure: '100 – 400 atm',
      color: '#4a7fff',
      bgTop: '#030818',
      bgBot: '#010510',
      creatures: ['anglerfish', 'viperfish', 'gulper_eel', 'dragonfish'],
    },
    {
      id: 'abyss',
      name: 'Abyss Zone',
      depth: '4,000 – 6,000 m',
      maxDepth: 6000,
      minDepth: 4000,
      temp: '2°C → 0°C',
      pressure: '400 – 600 atm',
      color: '#9b59b6',
      bgTop: '#02030e',
      bgBot: '#010208',
      creatures: ['dumbo_octopus', 'sea_cucumber', 'brittle_star', 'deep_sea_crab', 'giant_isopod'],
    },
    {
      id: 'hadal',
      name: 'Hadal Zone',
      depth: '6,000 – 11,000 m',
      maxDepth: 11000,
      minDepth: 6000,
      temp: '0°C → -1°C',
      pressure: '600 – 1,100 atm',
      color: '#00ffcc',
      bgTop: '#010108',
      bgBot: '#000003',
      creatures: ['snailfish', 'amphipod', 'xenophyophore'],
    },
  ];

  let currentZoneIndex = 0;
  let creaturePanelCleanup = null;
  let soundEnabled = false;
  let audioCtx = null;

  /* ── HELPERS ── */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ── HUD UPDATE ── */
  function updateHUD(progress) {
    // progress 0..1 across full 5-zone scroll
    const totalDepth = 11000;
    const depth = Math.round(progress * totalDepth);
    const pressure = Math.max(1, Math.round(depth / 10));
    const temp = Math.round(lerp(25, -1, progress));

    // find current zone
    let zi = 0;
    for (let i = ZONES.length - 1; i >= 0; i--) {
      if (depth >= ZONES[i].minDepth) { zi = i; break; }
    }

    const zone = ZONES[zi];
    document.getElementById('hudDepth').textContent    = depth.toLocaleString() + ' m';
    document.getElementById('hudPressure').textContent = pressure.toLocaleString() + ' atm';
    document.getElementById('hudTemp').textContent     = temp + '°C';
    document.getElementById('hudZone').textContent     = zone.name;
    document.getElementById('hudZone').style.color     = zone.color;

    // hero depth meter
    const heroDepth = document.querySelector('.depth-value');
    const depthFill  = document.querySelector('.depth-fill');
    if (heroDepth) heroDepth.textContent = depth.toLocaleString() + ' m';
    if (depthFill) {
      const pct = (progress * 100) + '%';
      if (window.innerWidth <= 768) {
        depthFill.style.width  = pct;
        depthFill.style.height = '100%';
      } else {
        depthFill.style.height = pct;
        depthFill.style.width  = '';
      }
    }

    // zone overlay watermark
    if (zi !== currentZoneIndex) {
      currentZoneIndex = zi;
      const big = document.getElementById('zoneNameBig');
      const range = document.getElementById('zoneDepthRange');
      if (big) {
        big.style.opacity = '0';
        setTimeout(() => {
          big.textContent = zone.name.toUpperCase();
          range.textContent = zone.depth;
          big.style.opacity = '1';
          big.style.transition = 'opacity 0.8s';
        }, 200);
      }
    }

    return { zone, depth, pressure, temp, zi };
  }

  /* ── CREATURE PANEL ── */
  function openCreaturePanel(key) {
    const data = CreatureSystem.CREATURE_DATA[key];
    if (!data) return;

    document.getElementById('panelName').textContent     = data.name;
    document.getElementById('panelSci').textContent      = data.sci;
    document.getElementById('panelZone').textContent     = data.zone;
    document.getElementById('panelDepth').textContent    = data.depth;
    document.getElementById('panelLifespan').textContent = data.lifespan;
    document.getElementById('panelDiet').textContent     = data.diet;

    const factsList = document.getElementById('panelFacts');
    factsList.innerHTML = data.facts.map(f => `<li>${f}</li>`).join('');

    // Stop any existing preview, then start the new one
    // (shared renderer handles context — no new WebGL context created)
    const canvas = document.getElementById('creaturePreview');
    if (creaturePanelCleanup) creaturePanelCleanup();
    creaturePanelCleanup = CreatureSystem.renderCreaturePreview(canvas, key);

    const panel = document.getElementById('creaturePanel');
    panel.classList.remove('hidden');
  }

  function closeCreaturePanel() {
    document.getElementById('creaturePanel').classList.add('hidden');
    if (creaturePanelCleanup) { creaturePanelCleanup(); creaturePanelCleanup = null; }
  }

  /* ── MARINE LIFE GRID ── */
  function buildMarineGrid() {
    const grid = document.getElementById('marineGrid');
    if (!grid) return;

    const allCreatures = [
      { key: 'dolphin',       zone: 'sunlight',  zoneLabel: 'Sunlight Zone',  sci: 'Delphinus delphis' },
      { key: 'sea_turtle',    zone: 'sunlight',  zoneLabel: 'Sunlight Zone',  sci: 'Chelonia mydas' },
      { key: 'great_white',   zone: 'sunlight',  zoneLabel: 'Sunlight Zone',  sci: 'Carcharodon carcharias' },
      { key: 'blue_whale',    zone: 'sunlight',  zoneLabel: 'Sunlight Zone',  sci: 'Balaenoptera musculus' },
      { key: 'lanternfish',   zone: 'twilight',  zoneLabel: 'Twilight Zone',  sci: 'Myctophum punctatum' },
      { key: 'jellyfish',     zone: 'twilight',  zoneLabel: 'Twilight Zone',  sci: 'Aurelia aurita' },
      { key: 'giant_squid',   zone: 'twilight',  zoneLabel: 'Twilight Zone',  sci: 'Architeuthis dux' },
      { key: 'swordfish',     zone: 'twilight',  zoneLabel: 'Twilight Zone',  sci: 'Xiphias gladius' },
      { key: 'anglerfish',    zone: 'midnight',  zoneLabel: 'Midnight Zone',  sci: 'Melanocetus johnsonii' },
      { key: 'viperfish',     zone: 'midnight',  zoneLabel: 'Midnight Zone',  sci: 'Chauliodus macouni' },
      { key: 'gulper_eel',    zone: 'midnight',  zoneLabel: 'Midnight Zone',  sci: 'Eurypharynx pelecanoides' },
      { key: 'dragonfish',    zone: 'midnight',  zoneLabel: 'Midnight Zone',  sci: 'Idiacanthus atlanticus' },
      { key: 'dumbo_octopus', zone: 'abyss',     zoneLabel: 'Abyss Zone',     sci: 'Grimpoteuthis boylei' },
      { key: 'sea_cucumber',  zone: 'abyss',     zoneLabel: 'Abyss Zone',     sci: 'Holothuria floridana' },
      { key: 'brittle_star',  zone: 'abyss',     zoneLabel: 'Abyss Zone',     sci: 'Ophiura sarsii' },
      { key: 'deep_sea_crab', zone: 'abyss',     zoneLabel: 'Abyss Zone',     sci: 'Kiwa hirsuta' },
      { key: 'snailfish',     zone: 'hadal',     zoneLabel: 'Hadal Zone',     sci: 'Pseudoliparis swirei' },
      { key: 'amphipod',      zone: 'hadal',     zoneLabel: 'Hadal Zone',     sci: 'Hirondellea gigas' },
      { key: 'xenophyophore', zone: 'hadal',     zoneLabel: 'Hadal Zone',     sci: 'Syringammina fragilissima' },
      { key: 'giant_isopod',  zone: 'abyss',     zoneLabel: 'Abyss Zone',     sci: 'Bathynomus giganteus' },
    ];

    // Use IntersectionObserver so card previews only run when visible.
    // This keeps the number of concurrent rAF loops low and avoids
    // the "Too many WebGL contexts" warning since all previews share
    // one renderer (see creatures.js).
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const canvas = en.target.querySelector('canvas');
        if (!canvas) return;
        const key = canvas.dataset.creatureKey;
        if (en.isIntersecting) {
          CreatureSystem.renderCreaturePreview(canvas, key);
        } else {
          CreatureSystem.stopPreview(canvas);
        }
      });
    }, { threshold: 0.1, rootMargin: '100px' });

    allCreatures.forEach(c => {
      const card = document.createElement('div');
      card.className = 'marine-card';
      card.innerHTML = `
        <canvas width="200" height="120" data-creature-key="${c.key}" style="background:rgba(0,5,15,0.6);border-radius:8px;display:block;"></canvas>
        <p class="marine-card-zone zone-${c.zone}">${c.zoneLabel}</p>
        <h3>${CreatureSystem.CREATURE_DATA[c.key] ? CreatureSystem.CREATURE_DATA[c.key].name : c.key}</h3>
        <p>${c.sci}</p>
      `;
      card.addEventListener('click', () => openCreaturePanel(c.key));
      grid.appendChild(card);
      cardObserver.observe(card);
    });
  }

  /* ── NAVBAR ── */
  function initNavbar() {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.section);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Mobile hamburger toggle
    const navToggle = document.getElementById('navToggle');
    const navLinksEl = document.querySelector('.nav-links');
    if (navToggle && navLinksEl) {
      navToggle.addEventListener('click', () => {
        navLinksEl.classList.toggle('open');
      });
      // Close menu when a link is clicked
      navLinksEl.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => navLinksEl.classList.remove('open'));
      });
    }

    // active highlight on scroll
    const sections = ['hero', 'zones', 'marine', 'expedition', 'facts'];
    const observer = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(l => l.classList.toggle('active', l.dataset.section === en.target.id));
        }
      });
    }, { threshold: 0.4 });
    sections.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }

  /* ── SOUND TOGGLE ── */
  function initSound() {
    const btn = document.getElementById('soundToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      btn.textContent = soundEnabled ? '🔊' : '🔇';
      if (soundEnabled) startAmbientSound();
      else stopAmbientSound();
    });
  }

  let noiseNode = null, gainNode = null;
  function startAmbientSound() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 2);
      gainNode.connect(audioCtx.destination);

      // deep ocean hum — filtered noise
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 120;
      filter.Q.value = 0.5;

      noiseNode.connect(filter);
      filter.connect(gainNode);
      noiseNode.start();
    } catch(e) { /* audio not supported */ }
  }
  function stopAmbientSound() {
    if (gainNode) { gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1); }
    setTimeout(() => { if (noiseNode) try { noiseNode.stop(); } catch(e) {} }, 1100);
  }

  /* ── INIT ── */
  function init() {
    initNavbar();
    initSound();

    document.getElementById('panelClose')?.addEventListener('click', closeCreaturePanel);

    // Explore button smooth scroll
    document.getElementById('exploreBtn')?.addEventListener('click', () => {
      document.getElementById('zones')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  return {
    ZONES,
    init,
    updateHUD,
    openCreaturePanel,
    closeCreaturePanel,
    buildMarineGrid,
  };

})();