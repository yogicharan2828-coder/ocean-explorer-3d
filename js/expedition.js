/* js/expedition.js
   Deep Sea Expedition Simulator — mini-game survival system
*/
'use strict';

const ExpeditionSim = (() => {

  /* ─── MISSION DEFINITIONS ─── */
  const MISSIONS = [
    {
      id: 'lost_at_sea',
      icon: '🌊',
      title: 'Lost at Sea',
      desc: 'Your vessel capsized in a storm 200km from shore. Survive until rescue.',
      intro: 'Your research vessel was struck by a rogue wave at night. The emergency beacon activated but rescue is 18 hours away. You\'re in open ocean, in a survival suit, clinging to debris...',
      steps: [
        {
          event: 'ALERT: Water temperature is 14°C. Hypothermia risk is HIGH.',
          choices: [
            { text: 'Stay still to conserve energy and body heat', oxygen: 0, temp: -5, energy: -5, visibility: 0, outcome: 'good' },
            { text: 'Swim frantically towards distant lights', oxygen: -10, temp: -15, energy: -30, visibility: 0, outcome: 'bad' },
            { text: 'Use debris as insulation and signal device', oxygen: 0, temp: 5, energy: -5, visibility: 15, outcome: 'best' },
          ]
        },
        {
          event: 'A massive dorsal fin circles your position. Great White Shark detected.',
          choices: [
            { text: 'Splash and thrash to scare it away', oxygen: -15, temp: -10, energy: -25, visibility: -10, outcome: 'bad' },
            { text: 'Stay completely still — sharks detect movement', oxygen: 0, temp: 0, energy: -5, visibility: 0, outcome: 'best' },
            { text: 'Dive underwater to assess the threat', oxygen: -20, temp: -5, energy: -10, visibility: 10, outcome: 'good' },
          ]
        },
        {
          event: 'You spot a supply buoy 300m away. It has flares and an emergency kit.',
          choices: [
            { text: 'Swim to it using controlled breaststroke', oxygen: -10, temp: -8, energy: -20, visibility: 20, outcome: 'best' },
            { text: 'Signal using debris reflection instead', oxygen: 0, temp: 0, energy: -5, visibility: 5, outcome: 'good' },
            { text: 'Wait — conserve energy, rescue is coming', oxygen: 5, temp: 5, energy: 0, visibility: -10, outcome: 'neutral' },
          ]
        },
        {
          event: 'Rescue helicopter spotted! But your signal device is depleted.',
          choices: [
            { text: 'Use the flares you retrieved from the buoy', oxygen: 0, temp: 0, energy: -5, visibility: 30, outcome: 'best' },
            { text: 'Wave your arms and hope they see you', oxygen: -5, temp: -5, energy: -15, visibility: 0, outcome: 'neutral' },
            { text: 'Dive to retrieve something reflective', oxygen: -20, temp: -10, energy: -20, visibility: 0, outcome: 'bad' },
          ]
        },
      ],
      endings: {
        survived: { emoji: '🚁', title: 'RESCUED!', desc: 'The helicopter crew spotted your flares. After 18 harrowing hours, you\'re airlifted to safety with mild hypothermia. Your calm decision-making saved your life. The ocean tested you — you passed.' },
        failed:   { emoji: '💀', title: 'LOST TO THE DEEP', desc: 'The combination of hypothermia and exhaustion overwhelmed your survival instincts. The ocean claimed another soul. In open water, panic is your deadliest enemy.' },
      }
    },
    {
      id: 'submarine_failure',
      icon: '🤿',
      title: 'Submarine Failure',
      desc: 'Your deep-sea research sub has lost power at 2,400m. Systems are failing.',
      intro: 'EMERGENCY ALERT — Power failure detected at 2,400 metres depth. Hull integrity: 87%. You have approximately 6 hours of emergency oxygen. The nearest rescue sub is 4 hours away...',
      steps: [
        {
          event: 'CRITICAL: Main oxygen recycler offline. Emergency reserves at 94%.',
          choices: [
            { text: 'Reduce crew movement to minimum — conserve O2', oxygen: 5, temp: 0, energy: -5, visibility: 5, outcome: 'best' },
            { text: 'Attempt to restart main recycler immediately', oxygen: -10, temp: 0, energy: -15, visibility: 0, outcome: 'neutral' },
            { text: 'Deploy emergency ascent immediately', oxygen: -20, temp: -10, energy: -20, visibility: -10, outcome: 'bad' },
          ]
        },
        {
          event: 'WARNING: Hull micro-fracture detected in Section 3. Pressure building.',
          choices: [
            { text: 'Apply emergency sealant from the repair kit', oxygen: -5, temp: 0, energy: -10, visibility: 10, outcome: 'best' },
            { text: 'Seal off Section 3 and redistribute pressure', oxygen: 0, temp: -5, energy: -5, visibility: 5, outcome: 'good' },
            { text: 'Ignore it — focus on communication', oxygen: 0, temp: 0, energy: 0, visibility: -20, outcome: 'bad' },
          ]
        },
        {
          event: 'Communications are intermittent. You have one clear transmission window.',
          choices: [
            { text: 'Transmit precise GPS and status report', oxygen: 0, temp: 0, energy: -5, visibility: 20, outcome: 'best' },
            { text: 'Broadcast emergency beacon continuously', oxygen: -5, temp: 0, energy: -10, visibility: 10, outcome: 'good' },
            { text: 'Try to reach the surface with degraded thrusters', oxygen: -15, temp: -10, energy: -25, visibility: 5, outcome: 'bad' },
          ]
        },
        {
          event: 'Rescue sub is 20 minutes out. O2 at 12%. Make your final call.',
          choices: [
            { text: 'Enter emergency stasis — slow breathing, minimal movement', oxygen: 8, temp: 0, energy: -5, visibility: 0, outcome: 'best' },
            { text: 'Begin controlled breathing exercises for the crew', oxygen: 5, temp: 5, energy: -5, visibility: 0, outcome: 'good' },
            { text: 'Attempt emergency EVA at 2,400m depth', oxygen: -30, temp: -20, energy: -30, visibility: -10, outcome: 'catastrophic' },
          ]
        },
      ],
      endings: {
        survived: { emoji: '⚓', title: 'MISSION COMPLETE', desc: 'The rescue sub docked with 8 minutes of oxygen to spare. Your engineering knowledge and calm leadership kept everyone alive at depths that crush steel. You\'ll receive commendation for your crew management under extreme pressure.' },
        failed:   { emoji: '🌑', title: 'BEYOND RESCUE DEPTH', desc: 'At 2,400m, the pressure is 240 atmospheres — equivalent to 240 cars stacked on every square inch. The hull finally gave. The deep keeps its secrets.' },
      }
    },
    {
      id: 'hadal_expedition',
      icon: '🕳️',
      title: 'Hadal Expedition',
      desc: 'Exploring the Mariana Trench at 10,900m. No human has gone deeper.',
      intro: 'Your solo deep-dive vessel descends into the Challenger Deep — the deepest point on Earth. At 10,900 metres, you are further from the surface than Everest is tall. Something has triggered your seismic sensors...',
      steps: [
        {
          event: 'SEISMIC ALERT: Minor earthquake detected. Trench walls shifting.',
          choices: [
            { text: 'Immediately begin controlled emergency ascent', oxygen: -5, temp: 0, energy: -10, visibility: 15, outcome: 'best' },
            { text: 'Hold position and take seismic readings — priceless data', oxygen: 0, temp: 0, energy: -5, visibility: -5, outcome: 'neutral' },
            { text: 'Move deeper to study the epicenter', oxygen: -10, temp: -5, energy: -15, visibility: -15, outcome: 'bad' },
          ]
        },
        {
          event: 'DISCOVERY: An unidentified bioluminescent organism 50m ahead — possibly unknown to science.',
          choices: [
            { text: 'Deploy camera drone for safe observation', oxygen: -5, temp: 0, energy: -10, visibility: 10, outcome: 'best' },
            { text: 'Approach slowly and document everything', oxygen: 0, temp: -5, energy: -5, visibility: 5, outcome: 'good' },
            { text: 'Activate sample collector and approach', oxygen: -10, temp: -5, energy: -20, visibility: 5, outcome: 'neutral' },
          ]
        },
        {
          event: 'POWER ALERT: Primary thrusters at 34%. Ascent will take twice as long.',
          choices: [
            { text: 'Begin ascent immediately — conserve remaining power', oxygen: 5, temp: 0, energy: -5, visibility: 10, outcome: 'best' },
            { text: 'Dump non-essential ballast for faster rise', oxygen: -5, temp: 0, energy: -15, visibility: 5, outcome: 'good' },
            { text: 'Attempt thruster repair at current depth', oxygen: -15, temp: -10, energy: -20, visibility: 0, outcome: 'bad' },
          ]
        },
        {
          event: 'SURFACE CONTACT: Research ship is 200m above. Final 90-minute ascent begins.',
          choices: [
            { text: 'Steady controlled ascent — decompress properly', oxygen: 5, temp: 5, energy: -5, visibility: 10, outcome: 'best' },
            { text: 'Rapid emergency ascent — bypass decompression', oxygen: -20, temp: -15, energy: -10, visibility: 0, outcome: 'bad' },
            { text: 'Gradual ascent with continuous data collection', oxygen: 0, temp: 0, energy: -10, visibility: 5, outcome: 'good' },
          ]
        },
      ],
      endings: {
        survived: { emoji: '🌟', title: 'HISTORY MADE', desc: 'You surface to cheers from the research vessel. Your footage of the unknown organism is broadcast worldwide. You\'ve set a new solo depth record and returned with data that will reshape our understanding of life. The deep sea remains mysterious — but you glimpsed its secrets.' },
        failed:   { emoji: '🕳️', title: 'CLAIMED BY THE DEEP', desc: 'The Mariana Trench claimed one more explorer. At 10,900m, rescue is physically impossible — the pressure would crush any rescue vessel. Your data, however, was automatically transmitted. Science marches on.' },
      }
    },
    {
      id: 'storm_survival',
      icon: '⛈️',
      title: 'Hurricane Survival',
      desc: 'A Category 5 hurricane traps your research team on a remote island.',
      intro: 'Hurricane Ophelia upgraded to Category 5 while you\'re conducting marine research on an uninhabited Pacific atoll. The nearest inhabited island is 340km away. You have 6 hours until landfall...',
      steps: [
        {
          event: 'STORM UPDATE: 185mph winds expected. Storm surge of 4 metres predicted.',
          choices: [
            { text: 'Move all equipment and team to highest ground immediately', oxygen: 0, temp: -5, energy: -20, visibility: 15, outcome: 'best' },
            { text: 'Secure the research equipment first', oxygen: 0, temp: -5, energy: -25, visibility: -5, outcome: 'neutral' },
            { text: 'Attempt sea evacuation before the storm arrives', oxygen: -15, temp: -15, energy: -25, visibility: -10, outcome: 'bad' },
          ]
        },
        {
          event: 'The eye wall arrives. 40-foot waves are sweeping the lower island.',
          choices: [
            { text: 'Lash yourselves to immovable structures with safety rope', oxygen: 0, temp: -10, energy: -10, visibility: 0, outcome: 'best' },
            { text: 'Shelter inside the reinforced equipment container', oxygen: 5, temp: 5, energy: 0, visibility: 0, outcome: 'good' },
            { text: 'Try to reach higher ground during a brief lull', oxygen: -20, temp: -20, energy: -30, visibility: -10, outcome: 'bad' },
          ]
        },
        {
          event: 'The eye passes overhead — 30 minutes of calm. Injuries: one team member has a broken arm.',
          choices: [
            { text: 'Stabilize the injury and prepare for the second eyewall', oxygen: 5, temp: 5, energy: -10, visibility: 10, outcome: 'best' },
            { text: 'Use the lull to reposition the team', oxygen: -5, temp: -5, energy: -20, visibility: 0, outcome: 'neutral' },
            { text: 'Attempt radio contact and stay completely still', oxygen: 5, temp: 5, energy: -5, visibility: 5, outcome: 'good' },
          ]
        },
        {
          event: 'Hurricane passes. Rescue team identified your beacon — ETA 3 hours. Floodwaters rising.',
          choices: [
            { text: 'Build a raft from debris and move to higher elevation', oxygen: 0, temp: -5, energy: -20, visibility: 10, outcome: 'good' },
            { text: 'Maintain position, conserve energy, keep signaling', oxygen: 5, temp: 5, energy: 0, visibility: 10, outcome: 'best' },
            { text: 'Swim 2km to the island\'s communication tower', oxygen: -20, temp: -20, energy: -30, visibility: 5, outcome: 'bad' },
          ]
        },
      ],
      endings: {
        survived: { emoji: '🏝️', title: 'SURVIVORS', desc: 'Coast Guard helicopters reach your position. All team members airlifted safely. The atoll was completely submerged within 4 hours of your rescue. Your instinct to prioritize human safety over equipment preserved every life. The research can be repeated. Lives cannot.' },
        failed:   { emoji: '🌀', title: 'ENGULFED', desc: 'Hurricane Ophelia claimed the atoll and everything on it. Category 5 storms generate forces that no human preparation can fully counter. Nature reminds us that the ocean\'s surface is as deadly as its depths.' },
      }
    },
  ];

  /* ─── GAME STATE ─── */
  let state = null;
  let currentMission = null;
  let stepIndex = 0;
  let gameEl = null;

  function resetState() {
    state = { oxygen: 75, temp: 70, energy: 80, visibility: 50, survival: 100 };
  }

  /* ─── RENDER GAUGES ─── */
  function renderGauges() {
    const gauges = [
      { key: 'oxygen',    label: 'OXYGEN',     color: '#00d4ff', icon: '💨' },
      { key: 'temp',      label: 'BODY TEMP',  color: '#ff6b35', icon: '🌡️' },
      { key: 'energy',    label: 'ENERGY',     color: '#00ff88', icon: '⚡' },
      { key: 'visibility',label: 'VISIBILITY', color: '#ffcc00', icon: '👁️' },
    ];
    return gauges.map(g => {
      const val = Math.max(0, Math.min(100, state[g.key]));
      const hue = val > 50 ? 120 : val > 25 ? 60 : 0;
      return `
        <div class="gauge-card">
          <div class="gauge-label">${g.icon} ${g.label}</div>
          <div class="gauge-bar">
            <div class="gauge-fill" style="width:${val}%;background:hsl(${hue},80%,50%)"></div>
          </div>
          <div class="gauge-val">${val}%</div>
        </div>
      `;
    }).join('');
  }

  /* ─── CALCULATE SURVIVAL ─── */
  function calcSurvival() {
    return Math.round((state.oxygen * 0.4 + state.temp * 0.25 + state.energy * 0.2 + state.visibility * 0.15));
  }

  /* ─── APPLY CHOICE ─── */
  function applyChoice(choice) {
    state.oxygen     = Math.max(0, Math.min(100, state.oxygen     + choice.oxygen));
    state.temp       = Math.max(0, Math.min(100, state.temp       + choice.temp));
    state.energy     = Math.max(0, Math.min(100, state.energy     + choice.energy));
    state.visibility = Math.max(0, Math.min(100, state.visibility + choice.visibility));
    state.survival   = calcSurvival();
  }

  /* ─── RENDER STEP ─── */
  function renderStep() {
    const mission = currentMission;
    const step = mission.steps[stepIndex];
    const survived = state.survival > 0 && state.oxygen > 0 && state.energy > 0;

    gameEl.innerHTML = `
      <div class="exp-story-box">
        <span style="color:var(--c-glow);font-size:0.7rem;letter-spacing:0.15em;">STEP ${stepIndex + 1} / ${mission.steps.length}</span>
        <div style="margin-top:0.75rem;">${mission.intro && stepIndex === 0 ? `<div style="color:#ccc;margin-bottom:1rem;font-size:0.85rem;font-style:italic;">${mission.intro}</div>` : ''}</div>
        <p class="story-event">${step.event}</p>
      </div>
      <div class="exp-gauges">${renderGauges()}</div>
      <div style="font-family:var(--font-display);font-size:0.6rem;letter-spacing:0.2em;color:var(--c-text-dim);margin-bottom:0.5rem;">CHOOSE YOUR ACTION:</div>
      <div class="exp-choices">
        ${step.choices.map((c, i) => `
          <button class="choice-btn" data-choice="${i}">${c.text}</button>
        `).join('')}
      </div>
    `;

    gameEl.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const choiceIdx = parseInt(btn.dataset.choice);
        applyChoice(step.choices[choiceIdx]);
        stepIndex++;
        if (stepIndex >= mission.steps.length || state.oxygen <= 0 || state.energy <= 0) {
          showOutcome();
        } else {
          renderStep();
        }
      });
    });
  }

  /* ─── SHOW OUTCOME ─── */
  function showOutcome() {
    const survived = calcSurvival() > 35 && state.oxygen > 0 && state.energy > 5;
    const ending = survived ? currentMission.endings.survived : currentMission.endings.failed;
    gameEl.innerHTML = `
      <div class="exp-outcome show">
        <div class="outcome-emoji">${ending.emoji}</div>
        <div class="outcome-title ${survived ? 'outcome-survived' : 'outcome-failed'}">${ending.title}</div>
        <p class="outcome-desc">${ending.desc}</p>
        <div class="exp-gauges" style="margin-bottom:1.5rem;">${renderGauges()}</div>
        <div style="font-family:var(--font-display);font-size:0.8rem;color:${survived?'var(--c-bio)':'#ff4d6d'};margin-bottom:1.5rem;">
          SURVIVAL SCORE: ${calcSurvival()}%
        </div>
        <button class="restart-btn" id="restartBtn">CHOOSE ANOTHER MISSION</button>
      </div>
    `;
    document.getElementById('restartBtn')?.addEventListener('click', renderMissionSelect);
  }

  /* ─── MISSION SELECT ─── */
  function renderMissionSelect() {
    const container = document.getElementById('expeditionApp');
    container.innerHTML = `
      <div id="expMissionGrid" class="mission-grid">
        ${MISSIONS.map(m => `
          <div class="mission-card" data-mission="${m.id}">
            <span class="mission-icon">${m.icon}</span>
            <div class="mission-title">${m.title}</div>
            <div class="mission-desc">${m.desc}</div>
          </div>
        `).join('')}
      </div>
      <div id="expGame" class="expedition-game"></div>
    `;

    gameEl = document.getElementById('expGame');

    container.querySelectorAll('.mission-card').forEach(card => {
      card.addEventListener('click', () => {
        const missionId = card.dataset.mission;
        currentMission = MISSIONS.find(m => m.id === missionId);
        if (!currentMission) return;
        stepIndex = 0;
        resetState();
        gameEl.classList.add('active');
        document.getElementById('expMissionGrid').style.display = 'none';
        renderStep();
      });
    });
  }

  /* ─── INIT ─── */
  function init() {
    renderMissionSelect();
  }

  return { init };

})();