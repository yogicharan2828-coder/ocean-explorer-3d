/* js/main.js
   Ocean Explorer 3D — Core Engine
   Hero: Rotating 3D Earth + water particles
   Ocean: Scroll-driven dive with zone transitions, creatures, bioluminescence,
          volumetric fog, light shafts, bubble systems, sonar pulse
*/
'use strict';

(function () {

  /* ══════════════════════════════════════════════════════
     SECTION 1 — HERO SCENE (Earth + particles)
  ══════════════════════════════════════════════════════ */

  function initHero() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight);
    renderer.shadowMap.enabled = false;
const initW = canvas.clientWidth || window.innerWidth;
const initH = canvas.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
  60,
  initW / initH,
  0.1,
  100
);
camera.position.set(0,0,8);
camera.lookAt(0,0,0)


    /* ── Starfield ── */
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) starPos[i] = (Math.random() - 0.5) * 180;
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.18, transparent: true, opacity: 0.7 })));

    /* ── Earth ── */
    const earthGeo = new THREE.SphereGeometry(1.5, 48, 48);

    // Procedural ocean+land shader
    const earthMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCloudTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uCloudTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Hash / noise helpers
        float hash(vec2 p) {
          p = fract(p * vec2(234.34, 435.345));
          p += dot(p, p + 34.23);
          return fract(p.x * p.y);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.,0.));
          float c = hash(i + vec2(0.,1.));
          float d = hash(i + vec2(1.,1.));
          vec2 u = f * f * (3. - 2.*f);
          return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.; float a = 0.5;
          for(int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
          return v;
        }

        void main() {
          vec3 sunDir = normalize(vec3(2., 1., 3.));
          float diff = max(dot(vNormal, sunDir), 0.0);
          float ambient = 0.15;

          // Latitude/longitude style coordinates
          float lat = vUv.y;
          float lon = vUv.x;

          // Procedural continents using fbm
          vec2 p = vec2(lon * 4.2, lat * 2.8);
          float land = fbm(p + vec2(1.3, 2.1));
          float isLand = smoothstep(0.54, 0.58, land);

          // Ice caps
          float iceCap = smoothstep(0.85, 0.95, lat) + smoothstep(0.15, 0.05, lat);
          isLand = max(isLand, iceCap);

          // Ocean color — deep blue to cyan by latitude
          vec3 oceanDeep = vec3(0.02, 0.08, 0.22);
          vec3 oceanShallow = vec3(0.0, 0.3, 0.6);
          float oceanDepthN = fbm(p * 0.7 + vec2(uTime * 0.02));
          vec3 oceanColor = mix(oceanDeep, oceanShallow, oceanDepthN * 0.6);

          // Ocean shimmer
          float shimmer = noise(p * 8. + vec2(uTime * 0.3)) * 0.07;
          oceanColor += shimmer * vec3(0., 0.3, 0.5);

          // Land color — green/brown terrain
          vec3 grassColor = vec3(0.15, 0.32, 0.1);
          vec3 desertColor = vec3(0.55, 0.42, 0.18);
          vec3 mountainColor = vec3(0.45, 0.42, 0.42);
          float terrainN = fbm(p * 2. + vec2(5.2));
          float elevation = fbm(p * 3.3 + vec2(2.7));
          vec3 landColor = mix(grassColor, desertColor, smoothstep(0.4, 0.6, terrainN));
          landColor = mix(landColor, mountainColor, smoothstep(0.62, 0.75, elevation));
          landColor = mix(landColor, vec3(0.9,0.95,1.0), iceCap);

          vec3 surfaceColor = mix(oceanColor, landColor, isLand);

          // Clouds
          float clouds = fbm(vec2(lon * 3. + uCloudTime * 0.015, lat * 3.5));
          clouds = smoothstep(0.48, 0.58, clouds) * 0.85;
          surfaceColor = mix(surfaceColor, vec3(0.95, 0.97, 1.0), clouds);

          // Lighting
          vec3 litColor = surfaceColor * (ambient + diff * 0.85);

          // Atmosphere rim
          float rimFactor = 1.0 - max(dot(vNormal, vec3(0.,0.,1.)), 0.0);
          rimFactor = pow(rimFactor, 3.5);
          vec3 atmosColor = vec3(0.1, 0.5, 1.0);
          litColor += atmosColor * rimFactor * 0.6;

          // Night side city lights glow
          float nightSide = 1.0 - smoothstep(0.0, 0.2, diff);
          float cityLight = fbm(p * 6.0) * (1.0 - isLand) * nightSide * 0.3;
          litColor += vec3(1.0, 0.8, 0.4) * cityLight;

          gl_FragColor = vec4(litColor, 1.0);
        }
      `,
    });

    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    /* ── Atmosphere glow shell ── */
    const atmosGeo = new THREE.SphereGeometry(1.58, 32, 32);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float rimFactor = 1.0 - max(dot(vNormal, vec3(0., 0., 1.)), 0.0);
          rimFactor = pow(rimFactor, 2.5);
          gl_FragColor = vec4(0.05, 0.35, 1.0, rimFactor * 0.55);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmosGeo, atmosMat));

    /* ── Water particles around Earth ── */
    const waterCount = 600;
    const wGeo = new THREE.BufferGeometry();
    const wPos = new Float32Array(waterCount * 3);
    const wPhase = new Float32Array(waterCount);
    for (let i = 0; i < waterCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 1.7 + Math.random() * 0.5;
      wPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      wPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      wPos[i * 3 + 2] = r * Math.cos(phi);
      wPhase[i] = Math.random() * Math.PI * 2;
    }
    wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
    const waterParticles = new THREE.Points(wGeo, new THREE.PointsMaterial({
      color: 0x00d4ff, size: 0.025, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(waterParticles);

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0x112244, 1.0));
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    /* ── Animate ── */
    let t = 0;
    function animate() {
      requestAnimationFrame(animate);
      t += 0.008;
      earth.rotation.y = t * 0.18;
      earthMat.uniforms.uTime.value = t;
      earthMat.uniforms.uCloudTime.value = t;
      waterParticles.rotation.y = t * 0.06;
      waterParticles.rotation.x = t * 0.02;
      // gentle bob
      earth.position.y = Math.sin(t * 0.3) * 0.04;
      renderer.render(scene, camera);
    }
    animate();

    /* ── Resize ── */
    function handleHeroResize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (w < 10 || h < 10) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', handleHeroResize);
    setTimeout(handleHeroResize, 100);
  }

  /* ══════════════════════════════════════════════════════
     SECTION 2 — OCEAN DIVE SCENE
  ══════════════════════════════════════════════════════ */

  function initOceanScene() {
    const canvas = document.getElementById('oceanCanvas');
    if (!canvas) return;

    const isMobile = window.innerWidth < 768;
    const DPR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    // Use window dimensions as fallback when canvas has no layout size yet
    const initW = canvas.clientWidth || window.innerWidth;
    const initH = canvas.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: !isMobile });
    renderer.setPixelRatio(DPR);
    renderer.setSize(initW, initH);
    renderer.setClearColor(0x001428, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x001428, 0.08);

    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 7);

    /* ── Lighting ── */
    const ambientLight = new THREE.AmbientLight(0x002244, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x00aaff, 2.0);
    sunLight.position.set(0, 8, 4);
    scene.add(sunLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 3, 12);
    pointLight1.position.set(3, 2, 2);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0044ff, 2, 10);
    pointLight2.position.set(-3, -1, 2);
    scene.add(pointLight2);

    /* ── WATER SURFACE SHADER ── */
    const waterGeo = new THREE.PlaneGeometry(30, 30, 64, 64);
    const waterMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:  { value: 0 },
        uColor: { value: new THREE.Color(0x004488) },
        uDepthColor: { value: new THREE.Color(0x000814) },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave1 = sin(pos.x * 0.8 + uTime * 1.2) * 0.18;
          float wave2 = sin(pos.y * 0.6 + uTime * 0.9) * 0.14;
          float wave3 = sin((pos.x + pos.y) * 0.5 + uTime * 0.7) * 0.1;
          pos.z += wave1 + wave2 + wave3;
          vElevation = pos.z;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uDepthColor;
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        void main() {
          float mixFactor = (vElevation + 0.4) / 0.8;
          vec3 color = mix(uDepthColor, uColor, clamp(mixFactor, 0., 1.));
          float ripple = sin(vUv.x * 30. + uTime * 2.) * sin(vUv.y * 30. + uTime * 1.5) * 0.04;
          color += vec3(0., 0.05 + ripple, 0.1 + ripple);
          gl_FragColor = vec4(color, 0.75);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 3.5;
    scene.add(waterMesh);

    /* ── LIGHT SHAFTS (God Rays) ── */
    const shaftGroup = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const h = 8 + Math.random() * 4;
      const shaftGeo = new THREE.CylinderGeometry(0.06, 0.35, h, 4, 1, true);
      const shaftMat = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.025 + Math.random() * 0.03,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set((Math.random() - 0.5) * 10, 3 - h / 2, (Math.random() - 0.5) * 6 - 2);
      shaft.rotation.x = (Math.random() - 0.5) * 0.3;
      shaft.rotation.z = (Math.random() - 0.5) * 0.2;
      shaftGroup.add(shaft);
    }
    scene.add(shaftGroup);

    /* ── BUBBLE SYSTEM ── */
    function createBubbles(count, spread) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const phases = [];
      for (let i = 0; i < count; i++) {
        pos[i * 3]     = (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        pos[i * 3 + 2] = (Math.random() - 0.5) * spread - 2;
        phases.push(Math.random() * Math.PI * 2);
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xaaddff, size: 0.045, transparent: true, opacity: 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return { pts, phases, count };
    }

    const bubbles = createBubbles(isMobile ? 120 : 200, 16);

    /* ── BIOLUMINESCENT PARTICLES ── */
    const bioParticles = CreatureSystem.createBioParticles(THREE, scene, isMobile ? 150 : 300);

    /* ── FISH SCHOOL ── */
    const fishSchool = CreatureSystem.createFishSchool(THREE, scene, isMobile ? 60 : 120, 0x88ccff);

    /* ── ZONE CREATURES ── */
    const ZONE_IDS = ['sunlight', 'twilight', 'midnight', 'abyss', 'hadal'];
    let activeCreatures = [];
    let currentZoneId = 'sunlight';
    let creatureClickTargets = [];

    function loadZoneCreatures(zoneId) {
      // Remove old creatures
      activeCreatures.forEach(c => scene.remove(c.mesh));
      activeCreatures = [];
      creatureClickTargets = [];

      const zone = OceanUI.ZONES.find(z => z.id === zoneId);
      if (!zone) return;

      const creators = CreatureSystem.ZONE_CREATORS[zoneId];
      if (!creators) return;

      creators(THREE).forEach((creature, i) => {
        const baseY = (Math.random() - 0.5) * 1.5;
        creature._baseY = baseY;
        creature.mesh.position.set(
          (Math.random() - 0.5) * 4,
          baseY,
          (Math.random() - 0.5) * 3 - 1
        );
        if (window.innerWidth < 768) {

  creature.mesh.scale.set(1.8, 1.8, 1.8);

  creature.mesh.position.set(
    (Math.random() - 0.5) * 2,
    baseY,
    (Math.random() - 0.5) * 1.5
  );

}
        scene.add(creature.mesh);
        activeCreatures.push(creature);

        // Raycasting bounding sphere for click
        creatureClickTargets.push({ creature, key: zone.creatures[i] });
      });
    }

    loadZoneCreatures('sunlight');

    /* ── SONAR PULSE ── */
    const sonarGeo = new THREE.RingGeometry(0.1, 0.12, 32);
    const sonarMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc, transparent: true, opacity: 0.8,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    });
    const sonarRing = new THREE.Mesh(sonarGeo, sonarMat);
    sonarRing.rotation.x = -Math.PI / 2;
    sonarRing.position.set(0, -1, 0);
    scene.add(sonarRing);

    /* ── VOLUMETRIC FOG PLANE ── */
    const fogGeo = new THREE.PlaneGeometry(30, 16);
    const fogMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.08 }, uColor: { value: new THREE.Color(0x001428) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying vec2 vUv;
        float noise(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float smoothNoise(vec2 p){ vec2 i=floor(p),f=fract(p); float a=noise(i),b=noise(i+vec2(1,0)),c=noise(i+vec2(0,1)),d=noise(i+vec2(1,1)); vec2 u=f*f*(3.-2.*f); return mix(mix(a,b,u.x),mix(c,d,u.x),u.y); }
        void main(){
          float n=smoothNoise(vUv*4.+vec2(uTime*0.05));
          float alpha=uOpacity*n;
          gl_FragColor=vec4(uColor,alpha);
        }
      `,
      transparent: true, depthWrite: false,
      blending: THREE.NormalBlending, side: THREE.DoubleSide,
    });
    const fogPlane = new THREE.Mesh(fogGeo, fogMat);
    fogPlane.position.z = -3;
    scene.add(fogPlane);

    /* ── RAYCASTER for creature clicking ── */
    const raycaster = new THREE.Raycaster();
    raycaster.far = 20;
    const mouse = new THREE.Vector2();

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      let closest = null, closestDist = Infinity;
      creatureClickTargets.forEach(target => {
        const sphere = new THREE.Sphere(target.creature.mesh.position, 1.2);
        if (raycaster.ray.intersectsSphere(sphere, new THREE.Vector3())) {
          const d = camera.position.distanceTo(target.creature.mesh.position);
          if (d < closestDist) { closestDist = d; closest = target; }
        }
      });
      if (closest) OceanUI.openCreaturePanel(closest.key);
    });

    /* ── SCROLL PROGRESS → ZONE DRIVE ── */
    let scrollProgress = 0;
    let targetScrollProgress = 0;

    function getScrollProgress() {
      const zonesEl = document.getElementById('zones');
      if (!zonesEl) return 0;
      const diveEl = document.getElementById('diveScroll');
      if (!diveEl) return 0;
      const zonesTop = zonesEl.getBoundingClientRect().top + window.scrollY;
      const totalHeight = diveEl.offsetHeight;
      const scrolled = window.scrollY - zonesTop;
      return Math.max(0, Math.min(1, scrolled / totalHeight));
    }

    window.addEventListener('scroll', () => {
      targetScrollProgress = getScrollProgress();
    }, { passive: true });
    function handleResize() {

  const width =
    canvas.clientWidth || window.innerWidth;

  const height =
    canvas.clientHeight || window.innerHeight;

  renderer.setSize(width, height, false);

  camera.aspect = width / height;

  camera.updateProjectionMatrix();

}

window.addEventListener("resize", handleResize);

setTimeout(handleResize, 300);

    /* ── ZONE COLORS ── */
    const ZONE_CONFIGS = [
      { bgColor: 0x001428, fogColor: 0x001428, fogDensity: 0.06, lightColor: 0x00aaff, ambientColor: 0x002244, shaftOpacity: 0.025, bioColor: 0x00d4ff },
      { bgColor: 0x000c30, fogColor: 0x000818, fogDensity: 0.09, lightColor: 0x4422ff, ambientColor: 0x080022, shaftOpacity: 0.01,  bioColor: 0x8844ff },
      { bgColor: 0x020510, fogColor: 0x010208, fogDensity: 0.13, lightColor: 0x002244, ambientColor: 0x020510, shaftOpacity: 0.003, bioColor: 0x0055ff },
      { bgColor: 0x010208, fogColor: 0x010105, fogDensity: 0.16, lightColor: 0x220033, ambientColor: 0x010208, shaftOpacity: 0.001, bioColor: 0x8800ff },
      { bgColor: 0x000003, fogColor: 0x000002, fogDensity: 0.22, lightColor: 0x000011, ambientColor: 0x000003, shaftOpacity: 0.0,  bioColor: 0x00ffcc },
    ];

    function lerpColor(c1, c2, t) {
      const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
      const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
      return ((Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t));
    }

    /* ── MAIN ANIMATE LOOP ── */
    let t = 0;
    let lastZoneIdx = -1;
    let sonarScale = 0;
    let sonarPulse = 0;

    function animate() {
      requestAnimationFrame(animate);
      t += 0.016;

      // Smooth scroll lerp
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.06;

      // HUD
      const { zi } = OceanUI.updateHUD(scrollProgress);

      // Zone transition
      if (zi !== lastZoneIdx) {
        lastZoneIdx = zi;
        const zoneId = ZONE_IDS[Math.min(zi, ZONE_IDS.length - 1)];
        if (zoneId !== currentZoneId) {
          currentZoneId = zoneId;
          loadZoneCreatures(zoneId);
        }
      }

      // Zone visual config blend
      const zoneF = scrollProgress * (ZONE_CONFIGS.length - 1);
      const zi2 = Math.floor(zoneF);
      const zt  = zoneF - zi2;
      const cfg1 = ZONE_CONFIGS[Math.min(zi2, ZONE_CONFIGS.length - 1)];
      const cfg2 = ZONE_CONFIGS[Math.min(zi2 + 1, ZONE_CONFIGS.length - 1)];

      const bgCol = lerpColor(cfg1.bgColor, cfg2.bgColor, zt);
      renderer.setClearColor(bgCol, 1);
      scene.fog.color.setHex(lerpColor(cfg1.fogColor, cfg2.fogColor, zt));
      scene.fog.density = cfg1.fogDensity + (cfg2.fogDensity - cfg1.fogDensity) * zt;

      ambientLight.color.setHex(lerpColor(cfg1.ambientColor, cfg2.ambientColor, zt));
      sunLight.color.setHex(lerpColor(cfg1.lightColor, cfg2.lightColor, zt));
      sunLight.intensity = Math.max(0.1, 2.0 - scrollProgress * 1.9);

      // Light shaft fade
      shaftGroup.children.forEach((shaft, i) => {
        shaft.material.opacity = cfg1.shaftOpacity * (1 - zt) + cfg2.shaftOpacity * zt + Math.sin(t * 0.4 + i) * 0.005;
      });
      shaftGroup.visible = scrollProgress < 0.65;

      // Water surface visible only near top
      waterMesh.visible = scrollProgress < 0.15;
      waterMat.uniforms.uTime.value = t;

      // Camera dive effect — subtle oscillation + depth plunge
      const camY = -scrollProgress * 0.8 + Math.sin(t * 0.3) * 0.06;
      camera.position.y = camY;
      camera.position.x = Math.sin(t * 0.15) * 0.12;
      camera.rotation.z = Math.sin(t * 0.2) * 0.012;
      camera.lookAt(0, camY, 0);

      // Keep creature group anchored to camera Y so they stay in frame on all screens
      activeCreatures.forEach(c => {
        if (c.mesh) c.mesh.position.y = camY + (c._baseY || 0);
      });

      // Bubbles
      const bPos = bubbles.pts.geometry.attributes.position.array;
      for (let i = 0; i < bubbles.count; i++) {
        bPos[i * 3 + 1] += 0.012 + Math.sin(t * 0.8 + bubbles.phases[i]) * 0.004;
        bPos[i * 3]     += Math.sin(t * 0.5 + bubbles.phases[i]) * 0.003;
        if (bPos[i * 3 + 1] > 4) bPos[i * 3 + 1] = -3 - Math.random() * 3;
      }
      bubbles.pts.geometry.attributes.position.needsUpdate = true;
      bubbles.pts.material.opacity = Math.max(0.05, 0.5 - scrollProgress * 0.45);

      // Bio particles
      bioParticles.update(t);
      bioParticles.mesh.material.opacity = 0.1 + scrollProgress * 0.6;
      const bioHue = scrollProgress > 0.8 ? 0.48 : scrollProgress > 0.5 ? 0.7 : 0.5;
      bioParticles.mesh.material.color.setHSL(bioHue, 1, 0.5);

      // Fish school
      fishSchool.update(t);
      fishSchool.mesh.material.opacity = Math.max(0.05, 0.8 - scrollProgress * 0.9);
      fishSchool.mesh.material.size = 0.06 - scrollProgress * 0.03;

      // Point lights pulse
      pointLight1.intensity = (2 + Math.sin(t * 1.1) * 0.5) * (1 - scrollProgress * 0.8);
      pointLight2.intensity = (1.5 + Math.sin(t * 0.7) * 0.4) * (0.3 + scrollProgress * 0.7);
      pointLight1.color.setHex(lerpColor(0x00d4ff, 0x0022aa, scrollProgress));
      pointLight2.color.setHex(lerpColor(0x0044ff, 0x440066, scrollProgress));

      // Sonar pulse
      sonarPulse += 0.025;
      if (sonarPulse > Math.PI * 2) {
        sonarPulse = 0;
        sonarScale = 0.1;
      }
      sonarScale = Math.min(sonarScale + 0.05, 6);
      sonarRing.scale.setScalar(sonarScale);
      sonarRing.material.opacity = Math.max(0, 0.8 - sonarScale / 6) * (0.3 + scrollProgress * 0.5);
      sonarRing.position.y = -1 - scrollProgress * 2;

      // Fog plane
      fogMat.uniforms.uTime.value = t;
      fogMat.uniforms.uOpacity.value = 0.06 + scrollProgress * 0.12;
      fogPlane.position.z = -3 - scrollProgress * 2;

      // Animate creatures — update handles rotation/X/Z movement only
      // Y is locked to camera by the anchor above
      activeCreatures.forEach(c => {
        if (c.update) {
          const savedY = c.mesh.position.y;
          c.update(t);
          // Restore Y after update (creature update fns may move Y)
          c.mesh.position.y = savedY;
        }
      });

      renderer.render(scene, camera);
    }

    animate();

    /* ── RESIZE ── */
    function handleResize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (w < 10 || h < 10) return; // guard against invalid size
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', handleResize);
    // Re-check after a tick (mobile browser may not layout canvas immediately)
    setTimeout(handleResize, 100);
    setTimeout(handleResize, 500);
  }

  /* ══════════════════════════════════════════════════════
     SECTION 3 — INIT ALL MODULES
  ══════════════════════════════════════════════════════ */

  function init() {
    // Modules
    OceanUI.init();
    OceanUI.buildMarineGrid();
    ExpeditionSim.init();
    OceanFacts.init();

    // Three.js scenes
    initHero();
    initOceanScene();

    // Scroll-driven animations for content sections
    initScrollReveal();

    // Sticky canvas positioning
    fixStickyCanvas();
  }

  /* ── SCROLL REVEAL ── */
  function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.style.opacity = '1';
          en.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.marine-card, .timeline-item, .gauge-card, .mission-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  /* ── STICKY CANVAS FIX ── */
  function fixStickyCanvas() {
    const canvas = document.getElementById('oceanCanvas');
    if (!canvas) return;
    // Ensure zones section has correct positioning for sticky
    const zonesEl = document.getElementById('zones');
    if (zonesEl) zonesEl.style.position = 'relative';
  }

  /* ── BOOT ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();