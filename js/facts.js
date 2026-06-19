/* js/facts.js
   Educational features: Ocean Facts Timeline, Depth Comparison, Pressure Demo
*/
'use strict';

const OceanFacts = (() => {

  const TIMELINE = [
    { year: '1872', title: 'HMS Challenger Expedition', desc: 'The first systematic oceanographic survey, discovering thousands of new species and the Mariana Trench. Modern oceanography was born.' },
    { year: '1943', title: 'Aqualung Invented', desc: 'Jacques Cousteau and Émile Gagnan invent the demand regulator, enabling SCUBA diving and opening the shallow ocean to exploration.' },
    { year: '1960', title: 'Deepest Dive Ever', desc: 'Jacques Piccard and Don Walsh descend to 10,916m in the bathyscaphe Trieste — still one of the deepest manned dives ever recorded.' },
    { year: '1977', title: 'Hydrothermal Vents Discovered', desc: 'Scientists discover life thriving around volcanic vents at 2,500m — completely without sunlight, rewriting the rules of biology.' },
    { year: '1985', title: 'Titanic Located', desc: 'Robert Ballard\'s expedition finds the RMS Titanic wreck at 3,810m, using new deep-sea ROV technology.' },
    { year: '2012', title: 'James Cameron Solo Dive', desc: 'Director James Cameron descends alone to 10,908m in the Deepsea Challenger — the first solo crewed dive to the ocean\'s deepest point.' },
    { year: '2022', title: 'Deepest Fish Recorded', desc: 'A snailfish is filmed at 8,336m in the Izu-Ogasawara Trench, breaking the record for deepest fish ever observed.' },
    { year: '2023', title: 'Ocean Treaty Signed', desc: 'The UN "High Seas Treaty" — the first international agreement to protect ocean biodiversity beyond national jurisdiction — is signed.' },
  ];

  const DEPTH_ITEMS = [
    { label: 'Eiffel Tower', depth: 330,    color: '#c0aa4a' },
    { label: 'Burj Khalifa', depth: 828,    color: '#b8c0d0' },
    { label: 'Titanic',      depth: 3800,   color: '#8855aa' },
    { label: 'Mt. Everest',  depth: 8849,   color: '#88aacc' },
    { label: 'Mariana',      depth: 11000,  color: '#00ffcc' },
  ];

  function buildTimeline() {
    return `
      <div class="facts-timeline">
        <div style="font-family:var(--font-display);font-size:0.75rem;letter-spacing:0.2em;color:var(--c-glow);margin-bottom:1rem;">
          ⏱️ OCEAN EXPLORATION TIMELINE
        </div>
        ${TIMELINE.map(item => `
          <div class="timeline-item">
            <div class="timeline-year">${item.year}</div>
            <div class="timeline-content">
              <h4>${item.title}</h4>
              <p>${item.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function buildDepthComparison() {
    const maxDepth = 11000;
    const maxHeight = 220;
    return `
      <div class="depth-comparison">
        <h3>📏 DEPTH COMPARISON VISUALIZER</h3>
        <div class="compare-bars">
          ${DEPTH_ITEMS.map(item => {
            const pct = item.depth / maxDepth;
            const height = Math.max(12, Math.round(pct * maxHeight));
            return `
              <div class="compare-item">
                <div class="compare-bar" style="height:${height}px;background:linear-gradient(180deg,${item.color},${item.color}55);position:relative;">
                  <span class="compare-bar-val" style="color:${item.color};">${item.depth >= 1000 ? (item.depth/1000).toFixed(1)+'km' : item.depth+'m'}</span>
                </div>
                <div class="compare-bar-label" style="color:${item.color};">${item.label}</div>
              </div>
            `;
          }).join('')}
        </div>
        <p style="text-align:center;margin-top:1rem;font-size:0.75rem;color:var(--c-text-dim);">
          The Mariana Trench is so deep that Mount Everest would fit inside with 2km to spare.
        </p>
      </div>
    `;
  }

  function buildPressureDemo() {
    return `
      <div class="pressure-demo">
        <h3>⚡ OCEAN PRESSURE DEMONSTRATOR</h3>
        <p>Drag the slider to feel what ocean depth does to pressure</p>
        <input type="range" id="pressureSlider" class="pressure-slider" min="0" max="11000" value="0" step="100" />
        <div class="pressure-output" id="pressureOutput">1 atm</div>
        <div class="pressure-equiv" id="pressureEquiv">Equivalent to normal atmospheric pressure at sea level</div>
        <div style="margin-top:1.5rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;" id="pressureFactCards"></div>
      </div>
    `;
  }

  function initPressureDemo() {
    const slider = document.getElementById('pressureSlider');
    const output = document.getElementById('pressureOutput');
    const equiv  = document.getElementById('pressureEquiv');
    const cards  = document.getElementById('pressureFactCards');
    if (!slider) return;

    const PRESSURE_FACTS = [
      { depth: 0,     atm: 1,    equiv: 'Normal atmospheric pressure — air weighs on you at sea level.', fact: 'Every 10m of ocean adds ~1 atmosphere of pressure.' },
      { depth: 200,   atm: 20,   equiv: 'Pressure of 20 atmospheres — you\'d need a SCUBA regulator to breathe.', fact: 'Human lungs would compress to the size of a fist.' },
      { depth: 1000,  atm: 100,  equiv: '100 atmospheres — equivalent to 1,000 kg pressing on every cm² of skin.', fact: 'Untreated wooden objects implode at this depth.' },
      { depth: 3800,  atm: 380,  equiv: 'Titanic depth — 380 atm. Steel bends. Nitrogen becomes narcotic.', fact: 'The Titanic\'s hull is under 380× normal pressure.' },
      { depth: 11000, atm: 1100, equiv: 'Mariana Trench — 1,100 atm. Equivalent to 50 jumbo jets on your thumbnail.', fact: 'Life still exists here, adapted over millions of years.' },
    ];

    slider.addEventListener('input', () => {
      const depth = parseInt(slider.value);
      const atm   = Math.max(1, Math.round(depth / 10));
      output.textContent = atm.toLocaleString() + ' atm';

      // color
      const hue = Math.max(0, 180 - (depth / 11000) * 180);
      output.style.color = `hsl(${hue}, 80%, 60%)`;

      // find closest fact
      let closest = PRESSURE_FACTS[0];
      for (const f of PRESSURE_FACTS) {
        if (depth >= f.depth) closest = f;
      }
      equiv.textContent = closest.equiv;

      // fact cards
      cards.innerHTML = `
        <div class="pressure-fact-card">
          <div class="pressure-fact-label">DEPTH</div>
          <div class="pressure-fact-val">${depth.toLocaleString()} m</div>
        </div>
        <div class="pressure-fact-card">
          <div class="pressure-fact-label">DID YOU KNOW?</div>
          <div class="pressure-fact-text">${closest.fact}</div>
        </div>
      `;
    });
  }

  function buildOceanFastFacts() {
    const facts = [
      { icon: '🌊', num: '71%',       label: 'of Earth covered by ocean' },
      { icon: '🌡️', num: '3.5°C',    label: 'average deep ocean temperature' },
      { icon: '🐟', num: '700,000+',  label: 'known marine species' },
      { icon: '💧', num: '97%',       label: 'of Earth\'s water is in the ocean' },
      { icon: '🌀', num: '50%',       label: 'of Earth\'s oxygen from ocean phytoplankton' },
      { icon: '🌑', num: '80%',       label: 'of the ocean remains unexplored' },
    ];
    return `
      <div class="facts-fast-grid">
        ${facts.map(f => `
          <div class="facts-fast-card"
               onmouseenter="this.style.borderColor='rgba(0,220,255,0.35)'" 
               onmouseleave="this.style.borderColor='rgba(0,220,255,0.12)'">
            <div class="facts-fast-icon">${f.icon}</div>
            <div class="facts-fast-num">${f.num}</div>
            <div class="facts-fast-label">${f.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function init() {
    const container = document.getElementById('factsApp');
    if (!container) return;

    container.innerHTML = `
      <div style="margin-bottom:2rem;">
        <div style="font-family:var(--font-display);font-size:0.7rem;letter-spacing:0.2em;color:var(--c-glow);text-align:center;margin-bottom:1.5rem;">🌊 THE OCEAN IN NUMBERS</div>
        ${buildOceanFastFacts()}
      </div>
      ${buildDepthComparison()}
      ${buildPressureDemo()}
      ${buildTimeline()}
    `;

    initPressureDemo();
  }

  return { init };

})();