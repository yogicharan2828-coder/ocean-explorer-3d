/* js/creatures.js
   Procedural creature generation — Three.js r128 compatible
   ALL geometries use only primitives available in r128:
   SphereGeometry, ConeGeometry, CylinderGeometry, BoxGeometry,
   TubeGeometry, RingGeometry, PlaneGeometry, BufferGeometry
   NO CapsuleGeometry (added in r142)

   WebGL context fix: marine grid cards use a single shared
   offscreen renderer instead of one renderer per canvas.
*/

'use strict';

const CreatureSystem = (() => {

  /* ─── CREATURE DATABASE ─── */
  const CREATURE_DATA = {
    dolphin: {
      name: 'Common Dolphin', sci: 'Delphinus delphis',
      zone: 'Sunlight Zone', depth: '0–200 m', lifespan: '25–35 years', diet: 'Fish, squid',
      facts: ['Dolphins sleep with one eye open','Can swim up to 60 km/h','Use echolocation to hunt','Live in pods of up to 1,000']
    },
    sea_turtle: {
      name: 'Green Sea Turtle', sci: 'Chelonia mydas',
      zone: 'Sunlight Zone', depth: '0–200 m', lifespan: '80+ years', diet: 'Seagrass, algae',
      facts: ['Navigate using Earth\'s magnetic field','Can hold breath 7 hours','Females return to birth beach to lay eggs','Critically endangered']
    },
    great_white: {
      name: 'Great White Shark', sci: 'Carcharodon carcharias',
      zone: 'Sunlight Zone', depth: '0–1,200 m', lifespan: '70+ years', diet: 'Seals, fish, cetaceans',
      facts: ['Can detect blood 1 part per million','Teeth replaced every 2 weeks','Can breach fully out of water','Warm-blooded unlike most fish']
    },
    blue_whale: {
      name: 'Blue Whale', sci: 'Balaenoptera musculus',
      zone: 'Sunlight Zone', depth: '0–500 m', lifespan: '80–90 years', diet: 'Krill',
      facts: ['Largest animal ever on Earth','Heart weighs 180 kg','Louder than a jet engine','Eat up to 4 tonnes of krill daily']
    },
    lanternfish: {
      name: 'Lanternfish', sci: 'Myctophum punctatum',
      zone: 'Twilight Zone', depth: '200–1,000 m', lifespan: '2–3 years', diet: 'Plankton, copepods',
      facts: ['Largest group of deep-sea fish','Migrate vertically every day','Bioluminescent photophores on body','Vital food source for whales & tuna']
    },
    jellyfish: {
      name: 'Moon Jellyfish', sci: 'Aurelia aurita',
      zone: 'Twilight Zone', depth: '0–400 m', lifespan: '1 year', diet: 'Zooplankton, fish eggs',
      facts: ['95% water by body weight','No brain, heart, or eyes','Can revert to juvenile form','Have existed for 500 million years']
    },
    giant_squid: {
      name: 'Giant Squid', sci: 'Architeuthis dux',
      zone: 'Twilight Zone', depth: '300–1,000 m', lifespan: '5 years', diet: 'Fish, shrimp',
      facts: ['Largest invertebrate on Earth','Eyes the size of dinner plates','Can change colour instantly','First filmed alive in 2004']
    },
    swordfish: {
      name: 'Swordfish', sci: 'Xiphias gladius',
      zone: 'Twilight Zone', depth: '200–900 m', lifespan: '9 years', diet: 'Fish, squid, crustaceans',
      facts: ['Can heat their eyes & brain','Swim up to 97 km/h','Bill used to slash prey','Travel thousands of miles annually']
    },
    anglerfish: {
      name: 'Deep-sea Anglerfish', sci: 'Melanocetus johnsonii',
      zone: 'Midnight Zone', depth: '1,000–4,000 m', lifespan: '25+ years', diet: 'Any prey it can catch',
      facts: ['Bioluminescent lure called esca','Males fuse permanently to females','Stomach can expand enormously','Pressure-adapted blood chemistry']
    },
    viperfish: {
      name: 'Pacific Viperfish', sci: 'Chauliodus macouni',
      zone: 'Midnight Zone', depth: '1,500–4,500 m', lifespan: '15–30 years', diet: 'Fish, crustaceans',
      facts: ['Fangs too large to close mouth','Photophores along the body','Migrate upward at night to feed','One of the fiercest predators by size']
    },
    gulper_eel: {
      name: 'Gulper Eel', sci: 'Eurypharynx pelecanoides',
      zone: 'Midnight Zone', depth: '500–3,000 m', lifespan: '40+ years', diet: 'Fish, invertebrates',
      facts: ['Mouth can open 180 degrees','Glowing tail tip used as lure','Can swallow prey larger than itself','Tail used for communication']
    },
    dragonfish: {
      name: 'Black Dragonfish', sci: 'Idiacanthus atlanticus',
      zone: 'Midnight Zone', depth: '200–2,000 m', lifespan: '5–10 years', diet: 'Fish, squid, crustaceans',
      facts: ['Produces far-red light invisible to most fish','Females 10x larger than males','Juveniles have stalked eyes','Bioluminescent barbel beneath chin']
    },
    dumbo_octopus: {
      name: 'Dumbo Octopus', sci: 'Grimpoteuthis boylei',
      zone: 'Abyss Zone', depth: '3,000–7,000 m', lifespan: '3–5 years', diet: 'Worms, bivalves',
      facts: ['Named for ear-like fins','Lives at greatest depth of any octopus','Swallows prey whole','Found worldwide in deep trenches']
    },
    sea_cucumber: {
      name: 'Sea Cucumber', sci: 'Holothuria floridana',
      zone: 'Abyss Zone', depth: '2,000–6,000 m', lifespan: '5–10 years', diet: 'Organic particles, plankton',
      facts: ['Make up 90% of deep-sea biomass by weight','Breathe through their anus','Can liquefy and re-solidify their body','Expel organs as defence mechanism']
    },
    brittle_star: {
      name: 'Brittle Star', sci: 'Ophiura sarsii',
      zone: 'Abyss Zone', depth: '2,000–5,000 m', lifespan: '5+ years', diet: 'Organic detritus',
      facts: ['Can regenerate all five arms','Fastest moving echinoderm','Some species are bioluminescent','No stomach - absorbs nutrients through tube feet']
    },
    deep_sea_crab: {
      name: 'Yeti Crab', sci: 'Kiwa hirsuta',
      zone: 'Abyss Zone', depth: '2,200 m', lifespan: 'Unknown', diet: 'Bacteria, minerals',
      facts: ['Discovered in 2005','Farms bacteria on its hairy claws','Lives near hydrothermal vents','Has reduced or no eyes']
    },
    snailfish: {
      name: 'Mariana Snailfish', sci: 'Pseudoliparis swirei',
      zone: 'Hadal Zone', depth: '6,000–8,000 m', lifespan: 'Unknown', diet: 'Amphipods, crustaceans',
      facts: ['Deepest-living fish ever recorded','At 8,336 m depth (world record)','Translucent pinkish body','Adapted to crushing pressure via TMAO']
    },
    amphipod: {
      name: 'Hadal Amphipod', sci: 'Hirondellea gigas',
      zone: 'Hadal Zone', depth: '6,000–11,000 m', lifespan: '2–3 years', diet: 'Organic detritus, dead animals',
      facts: ['Found in the Mariana Trench','Can withstand 1,000 atm pressure','Contain high levels of unsaturated fats','Scavengers of the deep - vital decomposers']
    },
    xenophyophore: {
      name: 'Xenophyophore', sci: 'Syringammina fragilissima',
      zone: 'Hadal Zone', depth: '8,000–11,000 m', lifespan: 'Unknown', diet: 'Organic material',
      facts: ['Largest single-celled organism on Earth','Up to 20 cm across','Provide habitat for other species','Absorb heavy metals like uranium']
    },
    giant_isopod: {
      name: 'Giant Isopod', sci: 'Bathynomus giganteus',
      zone: 'Abyss Zone', depth: '170–2,500 m', lifespan: '20+ years', diet: 'Dead whales, fish, squid',
      facts: ['Can go years without eating','Related to pill bugs & woodlice','Can roll into a ball for protection','First described in 1879']
    },
  };

  /* ════════════════════════════════════════
     CREATURE BUILDERS  (r128 safe — no CapsuleGeometry)
     All scaling done via mesh.scale, NOT geometry.scale()
     on non-BufferGeometry objects, to avoid the
     "geometry.scale is not a function" pitfall on TubeGeometry etc.
  ════════════════════════════════════════ */

  function makeShark(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x3a6090, shininess: 120, specular: new THREE.Color(0x8ab0c8) });

    // body — sphere scaled to torpedo shape
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat);
    body.scale.set(3.5, 1, 1);
    group.add(body);

    // tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 4), mat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.65, 0, 0);
    group.add(tail);

    // dorsal fin
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.28, 3), mat);
    dorsal.position.set(0.1, 0.22, 0);
    group.add(dorsal);

    // pectoral fins
    [-1, 1].forEach(s => {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.28, 3), mat);
      fin.rotation.x = Math.PI / 2;
      fin.position.set(0.05, 0, s * 0.24);
      group.add(fin);
    });

    const obj = { mesh: group, data: CREATURE_DATA.great_white, tail };
    obj.update = function (t) {
      this.mesh.position.x = Math.sin(t * 0.4) * 3;
      this.mesh.position.z = Math.cos(t * 0.4) * 3;
      this.mesh.rotation.y = -Math.atan2(Math.cos(t * 0.4), -Math.sin(t * 0.4));
      this.tail.rotation.y = Math.sin(t * 4) * 0.4;
    };
    return obj;
  }

  function makeJellyfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xdd88ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, shininess: 200, specular: new THREE.Color(0xffffff) });

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    group.add(bell);

    const tentacles = [];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        pts.push(new THREE.Vector3(Math.sin(ang) * 0.3, -j * 0.14, Math.cos(ang) * 0.3));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tGeo = new THREE.TubeGeometry(curve, 8, 0.012, 4, false);
      const tm = new THREE.Mesh(tGeo, new THREE.MeshPhongMaterial({ color: 0xddaaff, shininess: 150, specular: new THREE.Color(0xffffff), transparent: true, opacity: 0.4 }));
      group.add(tm);
      tentacles.push({ mesh: tm, phase: i });
    }

    const obj = { mesh: group, data: CREATURE_DATA.jellyfish, bell, tentacles };
    obj.update = function (t) {
      const pulse = Math.sin(t * 1.5) * 0.12 + 1;
      this.bell.scale.set(pulse, 0.7 + Math.sin(t * 1.5) * 0.1, pulse);
      this.mesh.position.y = Math.sin(t * 0.5) * 0.8;
      this.mesh.position.x = Math.sin(t * 0.3) * 2;
    };
    return obj;
  }

  function makeDolphin(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x4a80a0, shininess: 160, specular: new THREE.Color(0xaaccdd) });

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mat);
    body.scale.set(1, 0.6, 3);
    group.add(body);

    // snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4, 6), mat);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(0.5, 0, 0.42);
    group.add(snout);

    // dorsal fin
    const dorsal = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 3), mat);
    dorsal.position.set(0, 0.25, 0);
    group.add(dorsal);

    // tail fluke
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), mat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0, -0.55);
    group.add(tail);

    const obj = { mesh: group, data: CREATURE_DATA.dolphin, tail, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.6) * 3.5, Math.sin(pt * 1.2) * 0.4, Math.cos(pt * 0.6) * 3.5);
      this.mesh.rotation.y = -Math.atan2(Math.cos(pt * 0.6), -Math.sin(pt * 0.6)) + Math.PI;
      this.tail.rotation.x = Math.sin(pt * 5) * 0.35;
    };
    return obj;
  }

  function makeWhale(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x1a3a52, shininess: 40, specular: new THREE.Color(0x334455) });

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat);
    body.scale.set(1, 0.55, 3.5);
    group.add(body);

    // pectoral fins
    [-1, 1].forEach(s => {
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 4), mat);
      fin.scale.set(0.4, 0.1, 1);
      fin.position.set(0, -0.2, s * 0.7);
      fin.rotation.z = s * 0.4;
      group.add(fin);
    });

    // flukes
    [-1, 1].forEach(s => {
      const fluke = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 4), mat);
      fluke.scale.set(0.15, 1.2, 0.5);
      fluke.position.set(-1.6, 0, s * 0.35);
      group.add(fluke);
    });

    const obj = { mesh: group, data: CREATURE_DATA.blue_whale };
    obj.update = function (t) {
      this.mesh.position.set(Math.sin(t * 0.15) * 4.5, Math.sin(t * 0.3) * 0.3, Math.cos(t * 0.15) * 4.5);
      this.mesh.rotation.y = -Math.atan2(Math.cos(t * 0.15), -Math.sin(t * 0.15)) + Math.PI;
    };
    return obj;
  }

  function makeSeaTurtle(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x2d5a3f, shininess: 30, specular: new THREE.Color(0x445533) });

    // shell
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mat);
    shell.scale.set(1.4, 0.55, 1.1);
    group.add(shell);

    // head — plain sphere, NO CapsuleGeometry
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat);
    head.position.set(0.44, 0.02, 0);
    group.add(head);

    // flippers — elongated spheres (scale on mesh, not geometry)
    const flipperPos = [[0.18, 0, 0.38], [0.18, 0, -0.38], [-0.18, 0, 0.34], [-0.18, 0, -0.34]];
    flipperPos.forEach(([x, y, z]) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), mat);
      f.scale.set(1.6, 0.2, 0.55);
      f.position.set(x, y, z);
      group.add(f);
    });

    const obj = { mesh: group, data: CREATURE_DATA.sea_turtle, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.35) * 3, Math.sin(pt * 0.7) * 0.3, Math.cos(pt * 0.35) * 3);
      this.mesh.rotation.y = -Math.atan2(Math.cos(pt * 0.35), -Math.sin(pt * 0.35)) + Math.PI;
    };
    return obj;
  }

  function makeAnglerfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x1a0808, shininess: 20, specular: new THREE.Color(0x221100) });

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), mat);
    body.scale.set(1.6, 1.1, 1);
    group.add(body);

    // jaw
    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat);
    jaw.scale.set(1.3, 0.6, 0.8);
    jaw.position.set(0.35, -0.18, 0);
    group.add(jaw);

    // lure stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.5, 4), new THREE.MeshPhongMaterial({ color: 0x333333 }));
    stem.position.set(0.2, 0.4, 0);
    stem.rotation.z = 0.4;
    group.add(stem);

    // bioluminescent lure bulb
    const lureMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const lure = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), lureMat);
    lure.position.set(0.42, 0.65, 0);
    group.add(lure);

    const light = new THREE.PointLight(0x00ffaa, 1.5, 1.5);
    light.position.copy(lure.position);
    group.add(light);

    const obj = { mesh: group, data: CREATURE_DATA.anglerfish, lure, light, jawMesh: jaw };
    obj.update = function (t) {
      const glow = (Math.sin(t * 2.5) + 1) / 2;
      this.lure.material.color.setRGB(0, 0.8 + glow * 0.2, 0.5 + glow * 0.5);
      this.light.intensity = 1 + glow * 2;
      this.mesh.position.x = Math.sin(t * 0.25) * 2.8;
      this.mesh.position.z = Math.cos(t * 0.25) * 2.8;
      this.jawMesh.position.y = -0.18 + Math.sin(t * 1.5) * 0.06;
    };
    return obj;
  }

  function makeGiantSquid(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x6a2288, shininess: 80, specular: new THREE.Color(0x441166), transparent: true, opacity: 0.9 });

    // mantle
    const mantle = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.1, 8), mat);
    mantle.rotation.z = Math.PI / 2;
    group.add(mantle);

    // head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat);
    head.scale.set(1, 0.9, 1);
    head.position.set(0.62, 0, 0);
    group.add(head);

    // tentacles
    const tentacles = [];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const pts = [];
      for (let j = 0; j <= 6; j++) {
        pts.push(new THREE.Vector3(0.9 + j * 0.18, Math.sin(ang) * (0.15 + j * 0.03), Math.cos(ang) * (0.15 + j * 0.03)));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tGeo = new THREE.TubeGeometry(curve, 6, 0.018, 4, false);
      const tm = new THREE.Mesh(tGeo, new THREE.MeshPhongMaterial({ color: color || 0x882299, shininess: 60, specular: new THREE.Color(0x330066), transparent: true, opacity: 0.8 }));
      group.add(tm);
      tentacles.push({ mesh: tm, phase: i * 0.4, ang });
    }

    const obj = { mesh: group, data: CREATURE_DATA.giant_squid, tentacles };
    obj.update = function (t) {
      this.mesh.position.x = Math.sin(t * 0.3) * 3.5;
      this.mesh.position.z = Math.cos(t * 0.3) * 3.5;
      this.mesh.rotation.y = -Math.atan2(Math.cos(t * 0.3), -Math.sin(t * 0.3)) + Math.PI;
      this.tentacles.forEach(ten => {
        ten.mesh.rotation.x = Math.sin(t * 1.2 + ten.phase) * 0.25;
        ten.mesh.rotation.z = Math.sin(t * 0.8 + ten.phase) * 0.15;
      });
    };
    return obj;
  }

  function makeLanternfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x2a3850, shininess: 90, specular: new THREE.Color(0x6688aa) });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat);
    body.scale.set(2.2, 0.7, 0.7);
    group.add(body);

    // photophores
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.018, 4, 4), new THREE.MeshBasicMaterial({ color: 0x00ccff }));
      p.position.set((i - 2.5) * 0.07, -0.07, 0.06 * (i % 2 === 0 ? 1 : -1));
      group.add(p);
    }

    const obj = { mesh: group, data: CREATURE_DATA.lanternfish, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.8) * 3, Math.sin(pt * 1.6) * 0.5, Math.cos(pt * 0.8) * 3);
      this.mesh.rotation.y = Math.sin(pt * 0.8) > 0 ? 0 : Math.PI;
    };
    return obj;
  }

  function makeViperfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x080818, shininess: 60, specular: new THREE.Color(0x002244) });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.9, 6), mat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // oversized fangs
    [-1, 1].forEach(s => {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.22, 3), new THREE.MeshPhongMaterial({ color: 0xdddddd }));
      fang.position.set(0.44, -0.13, s * 0.04);
      fang.rotation.z = 0.3 * s;
      group.add(fang);
    });

    // photophore row
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.013, 4, 4), new THREE.MeshBasicMaterial({ color: 0x0088ff }));
      p.position.set((i - 3.5) * 0.1, -0.07, 0);
      group.add(p);
    }

    const obj = { mesh: group, data: CREATURE_DATA.viperfish, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.5) * 3.2, Math.sin(pt * 0.9) * 0.4, Math.cos(pt * 0.5) * 3.2);
      this.mesh.rotation.y = Math.sin(pt * 0.5) > 0 ? 0.2 : Math.PI + 0.2;
    };
    return obj;
  }

  function makeGulperEel(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x1a0028, shininess: 15, specular: new THREE.Color(0x110022) });

    // sinuous body via tube
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      pts.push(new THREE.Vector3(i * 0.12 - 0.8, Math.sin(i * 0.5) * 0.08, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const body = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.035, 6, false), mat);
    group.add(body);

    // huge mouth
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat);
    mouth.scale.set(1.5, 0.8, 0.9);
    mouth.position.set(-0.85, 0, 0);
    group.add(mouth);

    // glowing tail tip
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff44aa }));
    tip.position.set(1.12, 0, 0);
    group.add(tip);

    const tipLight = new THREE.PointLight(0xff44aa, 0.8, 0.8);
    tipLight.position.copy(tip.position);
    group.add(tipLight);

    const obj = { mesh: group, data: CREATURE_DATA.gulper_eel, tip, tipLight };
    obj.update = function (t) {
      this.mesh.position.x = Math.sin(t * 0.28) * 3;
      this.mesh.position.z = Math.cos(t * 0.28) * 3;
      this.tip.material.color.setHSL(0.85 + Math.sin(t * 3) * 0.05, 1, 0.6);
      this.tipLight.intensity = 0.5 + Math.sin(t * 3) * 0.4;
    };
    return obj;
  }

  function makeDumboOctopus(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xcc4422, shininess: 40, specular: new THREE.Color(0x884422), transparent: true, opacity: 0.9 });

    // body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat);
    body.scale.set(1, 0.9, 1);
    group.add(body);

    // ear fins
    [-1, 1].forEach(s => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat);
      ear.scale.set(0.35, 1.1, 0.55);
      ear.position.set(0, 0.18, s * 0.26);
      group.add(ear);
    });

    // 8 stubby tentacles
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.35, 4), mat);
      t.position.set(Math.sin(ang) * 0.18, -0.26, Math.cos(ang) * 0.18);
      t.lookAt(Math.sin(ang) * 0.8, -0.6, Math.cos(ang) * 0.8);
      group.add(t);
    }

    const obj = { mesh: group, data: CREATURE_DATA.dumbo_octopus, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.4) * 2.5, Math.sin(pt * 0.8) * 0.7, Math.cos(pt * 0.4) * 2.5);
    };
    return obj;
  }

  function makeSnailfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xf0ccaa, shininess: 80, specular: new THREE.Color(0xffeedd), transparent: true, opacity: 0.6 });

    // elongated tapered body via cylinder
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.015, 1.0, 8), mat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // eyes
    [-1, 1].forEach(s => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), new THREE.MeshBasicMaterial({ color: 0x000000 }));
      eye.position.set(-0.46, 0.04, s * 0.04);
      group.add(eye);
    });

    const obj = { mesh: group, data: CREATURE_DATA.snailfish, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.6) * 3, Math.sin(pt * 1.1) * 0.35, Math.cos(pt * 0.6) * 3);
      this.mesh.rotation.y = -Math.atan2(Math.cos(pt * 0.6), -Math.sin(pt * 0.6));
    };
    return obj;
  }

  function makeDragonfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x040410, shininess: 30, specular: new THREE.Color(0x000033) });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.025, 1.0, 6), mat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // chin barbel via tube
    const bPts = [
      new THREE.Vector3(0.3, 0, 0),
      new THREE.Vector3(0.25, -0.2, 0),
      new THREE.Vector3(0.35, -0.45, 0.1)
    ];
    const bGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bPts), 8, 0.008, 4, false);
    group.add(new THREE.Mesh(bGeo, new THREE.MeshPhongMaterial({ color: 0x222222 })));

    const bTip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff0044 }));
    bTip.position.set(0.35, -0.45, 0.1);
    group.add(bTip);

    // photophore row
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.011, 4, 4), new THREE.MeshBasicMaterial({ color: 0x0044ff }));
      p.position.set((i - 4.5) * 0.09, -0.04, 0.045);
      group.add(p);
    }

    const obj = { mesh: group, data: CREATURE_DATA.dragonfish, bTip, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.45) * 3, Math.sin(pt * 0.9) * 0.4, Math.cos(pt * 0.45) * 3);
      this.bTip.material.color.setHSL(0, 1, 0.4 + Math.sin(t * 4) * 0.2);
    };
    return obj;
  }

  function makeAmphipod(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xbbbb99, shininess: 15, specular: new THREE.Color(0x666655) });

    // body segments
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.06 - i * 0.008, 6, 4), mat);
      seg.scale.set(1.2, 0.7, 1);
      seg.position.x = i * 0.1 - 0.2;
      group.add(seg);
    }

    // legs
    for (let i = 0; i < 7; i++) {
      [-1, 1].forEach(s => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.2, 4), mat);
        leg.position.set(i * 0.07 - 0.24, -0.06, s * 0.07);
        leg.rotation.z = s * 0.4;
        group.add(leg);
      });
    }

    const obj = { mesh: group, data: CREATURE_DATA.amphipod, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.9) * 3, Math.sin(pt * 1.8) * 0.3, Math.cos(pt * 0.9) * 3);
      this.mesh.rotation.y = Math.sin(pt * 0.9) > 0 ? 0.3 : Math.PI + 0.3;
    };
    return obj;
  }

  function makeSeaCucumber(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x4a2a18, shininess: 10, specular: new THREE.Color(0x221108) });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.7, 8), mat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // tube feet
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2;
      const ft = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.008, 0.08, 4), mat);
      ft.position.set((Math.random() - 0.5) * 0.55, Math.sin(ang) * 0.11, Math.cos(ang) * 0.11);
      ft.rotation.z = ang;
      group.add(ft);
    }

    const obj = { mesh: group, data: CREATURE_DATA.sea_cucumber, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.2) * 2.5, -0.05, Math.cos(pt * 0.2) * 2.5);
    };
    return obj;
  }

  function makeBrittleStar(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xcc8830, shininess: 20, specular: new THREE.Color(0x664422) });

    group.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat));

    const arms = [];
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        pts.push(new THREE.Vector3(Math.cos(ang) * j * 0.1, 0, Math.sin(ang) * j * 0.1));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.018, 4, false), mat);
      group.add(arm);
      arms.push({ mesh: arm, ang, phase: i * 0.6 });
    }

    const obj = { mesh: group, data: CREATURE_DATA.brittle_star, arms, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.3) * 2.8, 0, Math.cos(pt * 0.3) * 2.8);
      this.mesh.rotation.y = t * 0.4;
    };
    return obj;
  }

  function makeYetiCrab(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xddddbb, shininess: 15, specular: new THREE.Color(0x888877) });

    // carapace
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), mat);
    shell.scale.set(1.3, 0.6, 1);
    group.add(shell);

    // legs
    for (let i = 0; i < 5; i++) {
      [-1, 1].forEach(s => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.32, 4), mat);
        leg.position.set((i - 2) * 0.09, -0.1, s * 0.22);
        leg.rotation.z = s * 0.5;
        group.add(leg);
      });
    }

    // claws
    [-1, 1].forEach(s => {
      const claw = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), mat);
      claw.scale.set(1.5, 0.8, 0.7);
      claw.position.set(0.32, 0, s * 0.22);
      group.add(claw);
    });

    const obj = { mesh: group, data: CREATURE_DATA.deep_sea_crab, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.5) * 2.5, 0, Math.cos(pt * 0.5) * 2.5);
      this.mesh.rotation.y = t * 0.3;
    };
    return obj;
  }

  function makeGiantIsopod(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x7a5a38, shininess: 20, specular: new THREE.Color(0x443322) });

    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.11 - i * 0.01, 8, 6), mat);
      seg.scale.set(1.2, 0.45, 0.9);
      seg.position.x = i * 0.1 - 0.25;
      group.add(seg);
    }

    for (let i = 0; i < 7; i++) {
      [-1, 1].forEach(s => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.007, 0.22, 4), mat);
        leg.position.set(i * 0.08 - 0.28, -0.07, s * 0.12);
        leg.rotation.z = s * 0.5;
        group.add(leg);
      });
    }

    const obj = { mesh: group, data: CREATURE_DATA.giant_isopod, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.4) * 2.8, 0, Math.cos(pt * 0.4) * 2.8);
    };
    return obj;
  }

  function makeXenophyophore(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0xddcc88, wireframe: true, transparent: true, opacity: 0.7 });

    for (let i = 0; i < 12; i++) {
      const r = 0.05 + Math.random() * 0.1;
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), mat);
      s.position.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.5);
      group.add(s);
    }

    const obj = { mesh: group, data: CREATURE_DATA.xenophyophore, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.15) * 2, 0, Math.cos(pt * 0.15) * 2);
      this.mesh.rotation.y = t * 0.08;
    };
    return obj;
  }

  function makeSwordfish(THREE, color) {
    const group = new THREE.Group();
    const mat = new THREE.MeshPhongMaterial({ color: color || 0x224466, shininess: 100 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat);
    body.scale.set(1, 0.55, 3.5);
    group.add(body);

    // bill
    const bill = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.7, 4), mat);
    bill.rotation.z = -Math.PI / 2;
    bill.position.set(0.5, 0, 0.7);
    group.add(bill);

    // tail fluke
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.25, 4), mat);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0, -0.5);
    group.add(tail);

    const obj = { mesh: group, data: CREATURE_DATA.swordfish, tail, phase: Math.random() * Math.PI * 2 };
    obj.update = function (t) {
      const pt = t + this.phase;
      this.mesh.position.set(Math.sin(pt * 0.7) * 3.2, Math.sin(pt * 1.4) * 0.3, Math.cos(pt * 0.7) * 3.2);
      this.mesh.rotation.y = -Math.atan2(Math.cos(pt * 0.7), -Math.sin(pt * 0.7)) + Math.PI;
      this.tail.rotation.x = Math.sin(pt * 6) * 0.3;
    };
    return obj;
  }

  /* ─── ZONE CREATURE FACTORY ─── */
  const ZONE_CREATORS = {
    sunlight:  T => [makeShark(T), makeDolphin(T), makeSeaTurtle(T), makeWhale(T)],
    twilight:  T => [makeLanternfish(T), makeJellyfish(T), makeGiantSquid(T), makeSwordfish(T)],
    midnight:  T => [makeAnglerfish(T), makeViperfish(T), makeGulperEel(T), makeDragonfish(T)],
    abyss:     T => [makeDumboOctopus(T), makeSeaCucumber(T), makeBrittleStar(T), makeYetiCrab(T), makeGiantIsopod(T)],
    hadal:     T => [makeSnailfish(T), makeAmphipod(T), makeXenophyophore(T)],
  };

  /* ════════════════════════════════════════
     SINGLE SHARED OFFSCREEN RENDERER
     Fixes "Too many WebGL contexts" warning.
     All card previews and the detail panel
     share one renderer; they render into an
     OffscreenCanvas then blit to the target.
  ════════════════════════════════════════ */

  const PREVIEW_W = 220;
  const PREVIEW_H = 160;

  // Lazily created shared renderer
  let _sharedRenderer = null;
  let _sharedScene    = null;
  let _sharedCamera   = null;

  function getShared() {
    if (_sharedRenderer) return { renderer: _sharedRenderer, scene: _sharedScene, camera: _sharedCamera };

    // Use an off-DOM canvas so we hold only ONE WebGL context for all previews
    const offCanvas = document.createElement('canvas');
    offCanvas.width  = PREVIEW_W;
    offCanvas.height = PREVIEW_H;

    _sharedRenderer = new THREE.WebGLRenderer({ canvas: offCanvas, alpha: true, antialias: true });
    _sharedRenderer.setSize(PREVIEW_W, PREVIEW_H);
    _sharedRenderer.setClearColor(0x000000, 0);

    _sharedScene  = new THREE.Scene();
    _sharedCamera = new THREE.PerspectiveCamera(40, PREVIEW_W / PREVIEW_H, 0.1, 50);
    _sharedCamera.position.set(2.0, 0.8, 2.0);
    _sharedCamera.lookAt(0, 0, 0);

    // Ambient: subtle blue-grey for underwater feel
    _sharedScene.add(new THREE.AmbientLight(0x1a2a44, 1.2));
    // Key light: blue-white top fill
    const dLight = new THREE.DirectionalLight(0x88ccff, 3);
    dLight.position.set(3, 6, 4);
    _sharedScene.add(dLight);
    // Fill light from below: very subtle warm
    const fillLight = new THREE.DirectionalLight(0x112233, 1.0);
    fillLight.position.set(-2, -3, 2);
    _sharedScene.add(fillLight);
    // Rim light for edge definition
    const rimLight = new THREE.DirectionalLight(0x004466, 1.5);
    rimLight.position.set(-4, 1, -3);
    _sharedScene.add(rimLight);

    return { renderer: _sharedRenderer, scene: _sharedScene, camera: _sharedCamera };
  }

  // Map of key -> { creature, animId } for active previews
  const _activePreviews = new Map();

  function renderCreaturePreview(targetCanvas, creatureKey) {
    // Stop existing preview for this canvas if re-used
    stopPreview(targetCanvas);

    const factory = {
      dolphin: makeDolphin, sea_turtle: makeSeaTurtle, great_white: makeShark,
      blue_whale: makeWhale, lanternfish: makeLanternfish, jellyfish: makeJellyfish,
      giant_squid: makeGiantSquid, swordfish: makeSwordfish, anglerfish: makeAnglerfish,
      viperfish: makeViperfish, gulper_eel: makeGulperEel, dragonfish: makeDragonfish,
      dumbo_octopus: makeDumboOctopus, sea_cucumber: makeSeaCucumber,
      brittle_star: makeBrittleStar, deep_sea_crab: makeYetiCrab, snailfish: makeSnailfish,
      amphipod: makeAmphipod, xenophyophore: makeXenophyophore, giant_isopod: makeGiantIsopod,
    }[creatureKey];
    if (!factory) return () => {};

    const { renderer, scene, camera } = getShared();
    const creature = factory(window.THREE);
    
    scene.add(creature.mesh);

    const ctx2d = targetCanvas.getContext('2d');
    let t = 0;
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.016;
      creature.update(t);
      // centre the mesh for preview
      creature.mesh.position.set(0, 0, 0);
      creature.mesh.rotation.y = t * 0.5;
      renderer.render(scene, camera);
      // blit from shared offscreen canvas → target 2D canvas
      ctx2d.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
      ctx2d.drawImage(renderer.domElement, 0, 0, targetCanvas.width, targetCanvas.height);
    }
    animate();

    const cleanup = () => {
      cancelAnimationFrame(animId);
      scene.remove(creature.mesh);
      // dispose geometries & materials
      creature.mesh.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      _activePreviews.delete(targetCanvas);
    };

    _activePreviews.set(targetCanvas, cleanup);
    return cleanup;
  }

  function stopPreview(targetCanvas) {
    if (_activePreviews.has(targetCanvas)) {
      _activePreviews.get(targetCanvas)();
    }
  }

  /* ─── SCHOOL OF FISH ─── */
  function createFishSchool(THREE, scene, count, color) {
    count = count || 120;
    color = color || 0x88ccff;
    const geo = new THREE.BufferGeometry();
    const positions  = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      velocities.push({ vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.01, vz: (Math.random() - 0.5) * 0.02 });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat   = new THREE.PointsMaterial({ color, size: 0.06, transparent: true, opacity: 0.8 });
    const school = new THREE.Points(geo, mat);
    scene.add(school);

    return {
      mesh: school,
      update(t) {
        const pos = school.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
          pos[i * 3]     += velocities[i].vx + Math.sin(t * 0.8 + i * 0.3) * 0.005;
          pos[i * 3 + 1] += velocities[i].vy + Math.cos(t * 0.6 + i * 0.4) * 0.003;
          pos[i * 3 + 2] += velocities[i].vz + Math.sin(t * 0.5 + i * 0.2) * 0.005;
          const limits = [4, 2, 4];
          for (let ax = 0; ax < 3; ax++) {
            const lim = limits[ax];
            if (pos[i * 3 + ax] >  lim) pos[i * 3 + ax] -= lim * 2;
            if (pos[i * 3 + ax] < -lim) pos[i * 3 + ax] += lim * 2;
          }
        }
        school.geometry.attributes.position.needsUpdate = true;
      }
    };
  }

  /* ─── BIOLUMINESCENT PARTICLES ─── */
  function createBioParticles(THREE, scene, count) {
    count = count || 300;
    const geo      = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00ffcc, size: 0.04, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    return {
      mesh: pts,
      update(t) {
        mat.opacity = 0.3 + Math.sin(t * 0.4) * 0.3;
        pts.rotation.y = t * 0.02;
      }
    };
  }

  /* ─── PUBLIC API ─── */
  return {
    CREATURE_DATA,
    ZONE_CREATORS,
    renderCreaturePreview,
    stopPreview,
    createFishSchool,
    createBioParticles,
  };

})();