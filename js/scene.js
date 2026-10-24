window.app = window.app || {};

const app = window.app;

app.scene = null;
app.camera = null;
app.renderer = null;
app.controls = null;
app.sunLight = null;
app.sunMesh = null;
app.galaxyParticles = null;
app.starfieldParticles = null;
app.celestialNodes = [];
app.orbits = [];
app.orbitLines = [];
app.activeShipGroup = null;
app.shipMeshMap = {};
app.autonomousUFO = null;
app.clock = null;

app.currentViewMode = '3rd';
app.currentShipType = 'recon';
app.activeTarget = null;
app.isWarping = false;
app.followTarget = null;
app.warpTarget = null;
app.isAligning = false;
app.currentAlignTween = null;
app.isCountdown = false;
app.currentCountdownInterval = null;
app.ufoState = {
  currentTarget: null,
  changeTimer: 0,
  changeInterval: 5,
  speed: 15,
  wanderRadius: 250,
  homePosition: new THREE.Vector3(50, 25, 70)
};

// Kecepatan gerak per tipe spaceship (satuan per detik)
app.shipSpeedMap = {
  recon: 45,   // cepat, cetak kelincah
  heavy: 20,   // lambat, tahan lumpur
  ufo: 32      // sedang, teknologi alien
};

// State tampilan UI (hide/show)
app.uiHidden = false;

app.toggleUI = function () {
  app.uiHidden = !app.uiHidden;
  const panels = document.querySelectorAll('.ui-panel');
  const icon = document.getElementById('ui-toggle-icon');
  const btn = document.getElementById('btn-toggle-ui');

  if (app.uiHidden) {
    panels.forEach((p) => { p.style.display = 'none'; });
    if (icon) icon.className = 'fa-solid fa-eye';
    if (btn) btn.title = 'Tampilkan UI';
  } else {
    panels.forEach((p) => { p.style.display = ''; });
    if (icon) icon.className = 'fa-solid fa-eye-slash';
    if (btn) btn.title = 'Sembunyikan UI';
  }
};

// Expose to window for inline HTML onclick
window.toggleUI = app.toggleUI;

app.followTargetPosition = new THREE.Vector3();
app._targetMovement = new THREE.Vector3();
app.distanceLODNodes = [];

app.keys = {};
app.lookYaw = 0;
app.lookPitch = 0;
app._lookDirection = new THREE.Vector3();
app._lookDragActive = false;
app._lookDragMoved = false;
app._lookLastPointer = null;

app.qualityLevel = 'high';
app.frustum = new THREE.Frustum();
app.fpsFrames = 0;
app.fpsTime = 0;
app.fps = 60;
app.lodEnabled = true;
app.lodDisabled = false;
app._lodCenter = new THREE.Vector3();
app._lodSphere = new THREE.Sphere();

app.detectDeviceQuality = function () {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const deviceMemory = navigator.deviceMemory || 8;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  if (isMobile || deviceMemory < 4 || hardwareConcurrency < 4) {
    app.qualityLevel = 'low';
  } else if (deviceMemory < 8 || hardwareConcurrency < 8) {
    app.qualityLevel = 'medium';
  } else {
    app.qualityLevel = 'high';
  }
  return app.qualityLevel;
};

app.getParticleCount = function (baseCount) {
  if (app.qualityLevel === 'low') return Math.floor(baseCount * 0.25);
  if (app.qualityLevel === 'medium') return Math.floor(baseCount * 0.5);
  return baseCount;
};

app.getSegmentCount = function (baseSegments) {
  if (app.qualityLevel === 'low') return Math.max(8, Math.floor(baseSegments * 0.25));
  if (app.qualityLevel === 'medium') return Math.max(16, Math.floor(baseSegments * 0.5));
  return baseSegments;
};

app.getGlowTexture = function () {
  if (app.glowTexture) return app.glowTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.12, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.32, 'rgba(255,255,255,0.45)');
  gradient.addColorStop(0.68, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  app.glowTexture = new THREE.CanvasTexture(canvas);
  return app.glowTexture;
};

app.getStarTexture = function () {
  if (app.starTexture) return app.starTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.95)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.35)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  app.starTexture = new THREE.CanvasTexture(canvas);
  return app.starTexture;
};

app.createLODPlanet = function (radius, map, glowColor = 0xffffff) {
  const lod = new THREE.LOD();
  const highGeo = new THREE.SphereGeometry(radius, app.getSegmentCount(48), app.getSegmentCount(48));
  const highMat = new THREE.MeshStandardMaterial({ map, roughness: 0.7, metalness: 0.1 });
  const highMesh = new THREE.Mesh(highGeo, highMat);
  lod.addLevel(highMesh, 0);

  const midGeo = new THREE.SphereGeometry(radius, app.getSegmentCount(24), app.getSegmentCount(24));
  const midMat = new THREE.MeshStandardMaterial({ map, roughness: 0.7, metalness: 0.1 });
  const midMesh = new THREE.Mesh(midGeo, midMat);
  lod.addLevel(midMesh, radius * 3);

  const lowGeo = new THREE.SphereGeometry(radius, app.getSegmentCount(12), app.getSegmentCount(12));
  const lowMat = new THREE.MeshBasicMaterial({ map, color: 0xffffff });
  const lowMesh = new THREE.Mesh(lowGeo, lowMat);
  lod.addLevel(lowMesh, radius * 8);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: app.getGlowTexture(),
    color: glowColor,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sprite.scale.set(radius * 3.5, radius * 3.5, 1);
  lod.addLevel(sprite, Math.max(500, radius * 20));

  lod.updateMatrixWorld();
  lod.matrixAutoUpdate = true;
  return lod;
};

app.addDistanceLOD = function (node, radius, color, detailDistance) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: app.getGlowTexture(),
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sprite.scale.set(radius * 3.5, radius * 3.5, 1);
  sprite.visible = false;

  node.add(sprite);
  app.distanceLODNodes.push({ node, radius, detailDistance, sprite });
};

app.initEngine = function () {
  const container = document.getElementById('canvas-container');

  app.scene = new THREE.Scene();
  app.scene.fog = new THREE.FogExp2(0x020205, 0.00005);
  app.scene.background = new THREE.Color(0x020205);

  app.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200000);
  app.camera.position.set(-200, 80, 240);
  app.camera.lookAt(0, 0, 0);
  app.scene.add(app.camera);

  app.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  app.renderer.setSize(window.innerWidth, window.innerHeight);
  app.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  app.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  app.renderer.toneMappingExposure = 1.2;
  container.appendChild(app.renderer.domElement);

  app.controls = new THREE.OrbitControls(app.camera, app.renderer.domElement);
  app.controls.enableDamping = true;
  app.controls.dampingFactor = 0.04;
  app.controls.maxDistance = 150000;
  app.controls.minDistance = 4;
  const initialLookDirection = new THREE.Vector3();
  app.camera.getWorldDirection(initialLookDirection);
  app.controls.target.copy(app.camera.position).add(initialLookDirection.multiplyScalar(100));
  app.controls.update();

  const ambient = new THREE.AmbientLight(0x404060, 0.4);
  app.scene.add(ambient);
  app.scene.add(new THREE.HemisphereLight(0xbfdfff, 0x18243a, 0.8));

  app.sunLight = new THREE.PointLight(0xfff0d0, 3.0, 0);
  app.sunLight.position.set(0, 0, 0);
  app.scene.add(app.sunLight);

  app.detectDeviceQuality();

  app.setupInput();
};

app.createPlanet = function (radius, map, segments = 64) {
  const geo = new THREE.SphereGeometry(radius, segments, segments);
  const mat = new THREE.MeshStandardMaterial({ map, roughness: 0.7, metalness: 0.1 });
  return new THREE.Mesh(geo, mat);
};

app.addAtmosphere = function (mesh, color, scale = 1.22, opacity = 0.18) {
  if (mesh.isLOD) {
    mesh.children.slice(0, 2).forEach((level) => {
      const r = level.geometry.parameters.radius;
      const geo = new THREE.SphereGeometry(r, 48, 48);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.BackSide, depthWrite: false });
      const atmosphere = new THREE.Mesh(geo, mat);
      atmosphere.scale.setScalar(scale);
      level.add(atmosphere);
    });
    return;
  }
  const r = mesh.geometry.parameters.radius;
  const geo = new THREE.SphereGeometry(r, 64, 64);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.BackSide, depthWrite: false });
  const atm = new THREE.Mesh(geo, mat);
  atm.scale.setScalar(scale);
  mesh.add(atm);
};

app.createOrbitLine = function (radius) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius);
  const points = curve.getPoints(128);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0xa8b8d0, transparent: true, opacity: 0.22 });
  const line = new THREE.LineLoop(geo, mat);
  line.rotation.x = Math.PI / 2;
  return line;
};

app.createSpiralGalaxy = function () {
  const parameters = {
    count: app.getParticleCount(24000),
    size: 0.55,
    radius: 210,
    branches: 4,
    spin: 1,
    randomness: 0.4,
    power: 4,
    insideColor: '#ffaa55',
    outsideColor: '#1e3a8a'
  };

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(parameters.count * 3);
  const colors = new Float32Array(parameters.count * 3);
  const colorInside = new THREE.Color(parameters.insideColor);
  const colorOutside = new THREE.Color(parameters.outsideColor);

  for (let i = 0; i < parameters.count; i++) {
    const i3 = i * 3;
    const radius = Math.random() * parameters.radius;
    const spinAngle = radius * parameters.spin;
    const branchAngle = ((i % parameters.branches) / parameters.branches) * Math.PI * 2;

    const randomX = Math.pow(Math.random(), parameters.power) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    const randomY = Math.pow(Math.random(), parameters.power) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;
    const randomZ = Math.pow(Math.random(), parameters.power) * (Math.random() < 0.5 ? 1 : -1) * parameters.randomness * radius;

    positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

    const mixedColor = colorInside.clone().lerp(colorOutside, radius / parameters.radius);
    colors[i3] = mixedColor.r;
    colors[i3 + 1] = mixedColor.g;
    colors[i3 + 2] = mixedColor.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: parameters.size,
    sizeAttenuation: true,
    map: app.getGlowTexture(),
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    transparent: true,
    opacity: 0.4
  });

  app.galaxyParticles = new THREE.Points(geometry, material);
  app.scene.add(app.galaxyParticles);
};

app.createStarfield = function () {
  const count = app.getParticleCount(5500);
  const divisions = 3;
  const cellSize = 3200 / divisions;
  const chunks = Array.from({ length: divisions ** 3 }, () => ({
    positions: [],
    colors: [],
    glowPositions: [],
    glowColors: []
  }));

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 3200;
    const y = (Math.random() - 0.5) * 3200;
    const z = (Math.random() - 0.5) * 3200;
    const ix = Math.min(divisions - 1, Math.floor((x + 1600) / cellSize));
    const iy = Math.min(divisions - 1, Math.floor((y + 1600) / cellSize));
    const iz = Math.min(divisions - 1, Math.floor((z + 1600) / cellSize));
    const chunk = chunks[ix * divisions * divisions + iy * divisions + iz];
    const centerX = -1600 + (ix + 0.5) * cellSize;
    const centerY = -1600 + (iy + 0.5) * cellSize;
    const centerZ = -1600 + (iz + 0.5) * cellSize;
    chunk.positions.push(x - centerX, y - centerY, z - centerZ);

    const c = Math.random() > 0.9 ? 3 : Math.random() > 0.7 ? 1 : 0;
    const color = [
      c === 0 ? 1 : c === 1 ? 0.85 : 0.55,
      c === 0 ? 1 : c === 1 ? 0.9 : 0.8,
      c === 0 ? 1 : c === 1 ? 0.95 : 1
    ];
    chunk.colors.push(...color);
    if (c === 3 || (c === 1 && Math.random() < 0.15)) {
      chunk.glowPositions.push(x - centerX, y - centerY, z - centerZ);
      chunk.glowColors.push(...color);
    }
  }

  const starMaterial = new THREE.PointsMaterial({
    size: 1.4,
    map: app.getStarTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.9
  });
  const glowMaterial = new THREE.PointsMaterial({
    size: 5,
    map: app.getGlowTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.42
  });
  app.starfieldParticles = new THREE.Group();
  chunks.forEach((chunk, index) => {
    if (chunk.positions.length === 0) return;
    const ix = Math.floor(index / (divisions * divisions));
    const iy = Math.floor((index / divisions) % divisions);
    const iz = index % divisions;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(chunk.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(chunk.colors, 3));
    const chunkPosition = new THREE.Vector3(
      -1600 + (ix + 0.5) * cellSize,
      -1600 + (iy + 0.5) * cellSize,
      -1600 + (iz + 0.5) * cellSize
    );
    const stars = new THREE.Points(geometry, starMaterial);
    stars.position.copy(chunkPosition);
    app.starfieldParticles.add(stars);

    if (chunk.glowPositions.length > 0) {
      const glowGeometry = new THREE.BufferGeometry();
      glowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(chunk.glowPositions, 3));
      glowGeometry.setAttribute('color', new THREE.Float32BufferAttribute(chunk.glowColors, 3));
      const glowStars = new THREE.Points(glowGeometry, glowMaterial);
      glowStars.position.copy(chunkPosition);
      app.starfieldParticles.add(glowStars);
    }
  });
  app.scene.add(app.starfieldParticles);
};

app.createNebula = function () {
  const count = app.getParticleCount(1200);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 850;
    positions[i + 1] = (Math.random() - 0.5) * 850;
    positions[i + 2] = (Math.random() - 0.5) * 850;
    const r = Math.random();
    colors[i] = r > 0.7 ? 0.6 : 0;
    colors[i + 1] = r > 0.6 ? 0.2 : 0;
    colors[i + 2] = 0.4 + Math.random() * 0.4;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2.2,
    map: app.getGlowTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  app.scene.add(new THREE.Points(geometry, material));
};

app.createSolarSystem = function () {
  const planetGlowColors = {
    Mercury: 0xd9c5a1,
    Venus: 0xffd7a3,
    Earth: 0x72bfff,
    Mars: 0xff7658,
    Jupiter: 0xffc98b,
    Saturn: 0xffe0a1,
    Uranus: 0x8cecff,
    Neptune: 0x527dff
  };
  const fitPlanetModelToRadius = (model, radius) => {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const diameter = Math.max(size.x, size.y, size.z);
    model.scale.multiplyScalar((radius * 2) / diameter);
  };
  const sunGroup = new THREE.Group();
  sunGroup.name = 'Sun';
  sunGroup.position.set(0, 0, 0);

  const loader = new THREE.GLTFLoader();
  loader.load('asset3D/object/sun.glb', (gltf) => {
    const sunModel = gltf.scene;
    sunModel.traverse((child) => {
      if (child.isMesh) {
        child.name = 'Sun';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    // Skala model agar cocok dengan skala tata surya yang ada
    sunModel.scale.setScalar(1.0);
    app.sunMesh = sunModel;
    app.sunMesh.name = 'Sun';
    sunGroup.add(app.sunMesh);
    app.sunLight.position.copy(sunGroup.position);
  }, undefined, (err) => {
    console.error('Gagal memuat model sun.glb:', err);
    // Fallback ke sphere prosedural jika model gagal dimuat
    const sunMeshTemp = app.createPlanet(9, createTexture(drawSun, 1024, 512), 96);
    app.sunMesh = new THREE.Mesh(
      sunMeshTemp.geometry,
      new THREE.MeshStandardMaterial({
        map: sunMeshTemp.material.map,
        emissive: new THREE.Color(0xffaa00),
        emissiveIntensity: 2
      })
    );
    app.sunMesh.name = 'Sun';
    sunGroup.add(app.sunMesh);
    app.sunLight.position.copy(sunGroup.position);
  });

  const coronaGeo = new THREE.SphereGeometry(11.5, 64, 64);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.22,
    side: THREE.BackSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  sunGroup.add(new THREE.Mesh(coronaGeo, coronaMat));

  app.scene.add(sunGroup);
  app.celestialNodes.push(sunGroup);
  app.addDistanceLOD(sunGroup, 12, 0xffaa33, 1200);

  ORBIT_CONFIG.forEach((p) => {
    const group = new THREE.Group();
    group.name = p.name;
    group.position.set(p.radius, 0, 0);

    // Orbit line (sinkron, tidak bergantung pada model)
    const orbitLine = app.createOrbitLine(p.radius);
    app.scene.add(orbitLine);
    app.orbitLines.push(orbitLine);

    // Mapping nama planet ke file GLB
    const glbMap = {
      'Mercury': 'asset3D/object/mercury.glb',
      'Venus': 'asset3D/object/venus.glb',
      'Earth': 'asset3D/object/earth.glb',
      'Mars': 'asset3D/object/mars.glb',
      'Jupiter': 'asset3D/object/jupiter.glb',
      'Saturn': 'asset3D/object/saturn.glb',
      'Uranus': 'asset3D/object/uranus_4k.glb',
      'Neptune': 'asset3D/object/neptune.glb',
      'Kepler-186f': 'asset3D/object/kepler-186f.glb'
    };

    const planetLoader = new THREE.GLTFLoader();
    planetLoader.load(glbMap[p.name], (gltf) => {
      const planetModel = gltf.scene;
      planetModel.traverse((child) => {
        if (child.isMesh) {
          child.name = p.name;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      fitPlanetModelToRadius(planetModel, p.radiusWorld);
      group.add(planetModel);

      // Saturn: cincin
      if (p.rings) {
        const ringGeo = new THREE.RingGeometry(p.radiusWorld * 1.35, p.radiusWorld * 2.1, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4a373, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }

      // Bulan-bulan (prosedural)
      for (let m = 0; m < p.moons; m++) {
        const moonDist = p.radiusWorld + 1.4 + m * 0.9;
        const moonGroup = new THREE.Group();
        const moonMesh = app.createLODPlanet(EARTH_RADIUS_WORLD * 0.273, createTexture(drawMoon, 256, 256), 0xd9d2c5);
        moonGroup.position.set(moonDist, 0, 0);
        moonGroup.add(moonMesh);
        group.add(moonGroup);
        app.celestialNodes.push(moonMesh);
        moonMesh.userData = { dist: moonDist, speed: Math.random() * 0.015 + 0.01, angle: Math.random() * Math.PI * 2, group: moonGroup };
      }

      // Earth: awan
      if (p.name === 'Earth') {
        const cloudMesh = app.createPlanet(p.radiusWorld * 1.06, createTexture(drawClouds, 512, 512), 64);
        cloudMesh.material = new THREE.MeshBasicMaterial({
          map: cloudMesh.material.map,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        group.add(cloudMesh);
        group.userData = { cloudMesh };
      }

      app.scene.add(group);
      app.celestialNodes.push(group);

      app.orbits.push({
        name: p.name,
        radius: p.radius,
        speed: p.speed,
        angle: Math.random() * Math.PI * 2,
        group: group,
        mesh: planetModel
      });
    }, undefined, (err) => {
      console.error('Gagal memuat model ' + p.name + '.glb:', err);
      // Fallback ke tekstur prosedural jika GLB gagal dimuat
      let map;
      if (p.name === 'Mercury' || p.name === 'Mars') {
        map = createTexture(drawMoon, 512, 256);
      } else if (p.name === 'Venus') {
        map = createTexture((c, w, h) => { c.fillStyle = '#e8dcc4'; c.fillRect(0, 0, w, h); drawClouds(c, w, h); });
      } else if (p.name === 'Earth') {
        map = createTexture((c, w, h) => drawPlanet(c, w, h, '#0b3d91', '#2d5a27', '#ffffff'));
      } else if (p.name === 'Jupiter') {
        map = createTexture((c, w, h) => drawBands(c, w, h, '#e3cba8', '#d4a373', '#a78b5a'));
      } else if (p.name === 'Saturn') {
        map = createTexture((c, w, h) => drawBands(c, w, h, '#f5deb3', '#d2b48c', '#deb887'));
      } else if (p.name === 'Uranus') {
        map = createTexture((c, w, h) => drawGas(c, w, h, '#bfe3f2', '#a8d8ea'));
      } else if (p.name === 'Neptune') {
        map = createTexture((c, w, h) => drawGas(c, w, h, '#1e3a8a', '#1e40af'));
      }

      const mesh = app.createLODPlanet(p.radiusWorld, map, planetGlowColors[p.name]);
      if (p.atmosphere) app.addAtmosphere(mesh, p.atmosphere);
      group.add(mesh);

      if (p.rings) {
        const ringGeo = new THREE.RingGeometry(p.radiusWorld * 1.35, p.radiusWorld * 2.1, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4a373, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
      }

      for (let m = 0; m < p.moons; m++) {
        const moonDist = p.radiusWorld + 1.4 + m * 0.9;
        const moonGroup = new THREE.Group();
        const moonMesh = app.createLODPlanet(EARTH_RADIUS_WORLD * 0.273, createTexture(drawMoon, 256, 256), 0xd9d2c5);
        moonGroup.position.set(moonDist, 0, 0);
        moonGroup.add(moonMesh);
        group.add(moonGroup);
        app.celestialNodes.push(moonMesh);
        moonMesh.userData = { dist: moonDist, speed: Math.random() * 0.015 + 0.01, angle: Math.random() * Math.PI * 2, group: moonGroup };
      }

      if (p.name === 'Earth') {
        const cloudMesh = app.createPlanet(p.radiusWorld * 1.06, createTexture(drawClouds, 512, 512), 64);
        cloudMesh.material = new THREE.MeshBasicMaterial({
          map: cloudMesh.material.map,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        });
        group.add(cloudMesh);
        group.userData = { cloudMesh };
      }

      app.scene.add(group);
      app.celestialNodes.push(group);

      app.orbits.push({
        name: p.name,
        radius: p.radius,
        speed: p.speed,
        angle: Math.random() * Math.PI * 2,
        group: group,
        mesh: mesh
      });
    });
  });

  const stationGroup = new THREE.Group();
  stationGroup.name = 'Nebula Station';
  stationGroup.position.set(-140, 45, -110);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(2.5, 2), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 }));
  core.name = 'Nebula Station';
  stationGroup.add(core);
  stationGroup.add(new THREE.Mesh(new THREE.TorusGeometry(4, 0.25, 16, 64), new THREE.MeshBasicMaterial({ color: 0x94a3b8 })));
  app.scene.add(stationGroup);
  app.celestialNodes.push(stationGroup);
  app.addDistanceLOD(stationGroup, 5, 0x94a3b8, 700);
};

app.createAutonomousUFO = function () {
    app.autonomousUFO = new THREE.Group();
    app.autonomousUFO.name = 'Autonomous Alien UFO';
    app.autonomousUFO.position.set(50, 25, 70);
    app.scene.add(app.autonomousUFO);

    // Inisialisasi target wander awal
    app.ufoState.currentTarget = new THREE.Vector3(
      50 + (Math.random() - 0.5) * 200,
      25 + (Math.random() - 0.5) * 100,
      70 + (Math.random() - 0.5) * 200
    );

    const ufoLoader = new THREE.GLTFLoader();
    ufoLoader.load('asset3D/object/ufo.glb', (gltf) => {
      const ufoModel = gltf.scene;
      ufoModel.traverse((child) => {
        if (child.isMesh) {
          child.name = 'ufo';
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      // Skalakan dan tengahkan model agar proporsional
      const bounds = new THREE.Box3().setFromObject(ufoModel);
      const size = bounds.getSize(new THREE.Vector3());
      const scale = 8 / Math.max(size.x, size.y, size.z);
      ufoModel.scale.setScalar(scale);
      const center = bounds.getCenter(new THREE.Vector3());
      ufoModel.position.copy(center).multiplyScalar(-scale);
      app.autonomousUFO.add(ufoModel);

      app.celestialNodes.push(app.autonomousUFO);
      app.addDistanceLOD(app.autonomousUFO, 25, 0x22c55e, 250);
    }, undefined, (err) => {
      console.error('Gagal memuat model ufo.glb dari object:', err);
      // Fallback ke model procedural jika GLB gagal dimuat
      const segs = app.getSegmentCount(48);
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 5.5, 1, segs),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.05 })
      );
      app.autonomousUFO.add(body);

      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(2.4, segs, Math.floor(segs / 2), 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transmission: 0.85, opacity: 1, transparent: true, roughness: 0 })
      );
      dome.position.y = 0.4;
      app.autonomousUFO.add(dome);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.25, segs, segs), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      ring.rotation.x = Math.PI / 2;
      app.autonomousUFO.add(ring);

      app.celestialNodes.push(app.autonomousUFO);
      app.addDistanceLOD(app.autonomousUFO, 25, 0x22c55e, 250);
    });
  };

app.createAndromeda = function () {
  const loader = new THREE.GLTFLoader();
  loader.load('asset3D/object/andromeda.glb', (gltf) => {
    const andromedaModel = gltf.scene;
    andromedaModel.name = 'Andromeda';
    andromedaModel.position.set(4200, 0, -3600);

    // Skala besar sebagai galaksi Andromeda
    andromedaModel.scale.setScalar(80);

    andromedaModel.traverse((child) => {
      if (child.isMesh) {
        child.name = 'Andromeda';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    app.scene.add(andromedaModel);
    app.celestialNodes.push(andromedaModel);
    app.addDistanceLOD(andromedaModel, 145, 0xffd700, 2500);
  }, undefined, (err) => {
    console.error('Gagal memuat model andromeda.glb:', err);
  });
};

app.createTriangulum = function () {
    const group = new THREE.Group();
    group.name = 'Triangulum';
    group.position.set(-5800, 200, -4900);

    const segs = app.getSegmentCount(64);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(14, segs, segs),
      new THREE.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0xa855f7, emissiveIntensity: 1.5, roughness: 0.4, metalness: 0.1 })
    );
    group.add(core);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(20, segs, segs),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.3, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(glow);

    const armsCount = app.getParticleCount(3000);
    const arms = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: armsCount }, () => {
          const r = Math.random() * 90 + 15;
          const a = Math.random() * Math.PI * 4;
          return new THREE.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 6, Math.sin(a) * r);
        })
      ),
      new THREE.PointsMaterial({ color: 0x8b5cf6, size: 1.2, map: app.getGlowTexture(), transparent: true, depthWrite: false, opacity: 0.5, blending: THREE.AdditiveBlending })
    );
    arms.rotation.x = Math.PI / 2.2;
    group.add(arms);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, 110, 0x8b5cf6, 2200);
};

app.createSombrero = function () {
    const group = new THREE.Group();
    group.name = 'Sombrero';
    group.position.set(7100, -800, -2400);

    const segs = app.getSegmentCount(64);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(12, segs, segs),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 2, roughness: 0.3, metalness: 0.1 })
    );
    group.add(core);

    const dustRing = new THREE.Mesh(
      new THREE.RingGeometry(15, 28, segs),
      new THREE.MeshBasicMaterial({ color: 0x3f3f46, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
    );
    dustRing.rotation.x = Math.PI / 2;
    group.add(dustRing);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(18, segs, segs),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(glow);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, 40, 0xfbbf24, 1800);
};

app.createTheVoid = function () {
    const group = new THREE.Group();
    group.name = 'The Void';
    group.position.set(-9200, 3000, -6100);

    const segs = app.getSegmentCount(64);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(60, segs, segs),
      new THREE.MeshBasicMaterial({ color: 0x020205, transparent: true, opacity: 0.95, side: THREE.BackSide, depthWrite: false })
    );
    group.add(sphere);

    const rim = new THREE.Mesh(
      new THREE.SphereGeometry(64, segs, segs),
      new THREE.MeshBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.15, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(rim);

    const fewStarCount = app.getParticleCount(40);
    const fewStars = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: fewStarCount }, () => new THREE.Vector3((Math.random()-0.5)*200, (Math.random()-0.5)*200, (Math.random()-0.5)*200))
      ),
      new THREE.PointsMaterial({ color: 0xffffff, size: 2, map: app.getGlowTexture(), transparent: true, depthWrite: false, opacity: 0.4, blending: THREE.AdditiveBlending })
    );
    group.add(fewStars);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, 180, 0x1e293b, 3000);
};

app.createPillarsOfCreation = function () {
    const group = new THREE.Group();
    group.name = 'Pillars of Creation';
    group.position.set(3100, -1500, 6800);

    const segs = app.getSegmentCount(16);
    const pillarColor = 0xd97706;
    for (let i = 0; i < 5; i++) {
      const px = (Math.random() - 0.5) * 30;
      const pz = (Math.random() - 0.5) * 30;
      const height = 12 + Math.random() * 18;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 1.2, height, segs),
        new THREE.MeshStandardMaterial({ color: pillarColor, roughness: 0.9, metalness: 0.1 })
      );
      pillar.position.set(px, height / 2, pz);
      group.add(pillar);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(2.4, 3, segs),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending })
      );
      cap.position.set(px, height + 1.2, pz);
      group.add(cap);
    }

    const glowCount = app.getParticleCount(2000);
    const glow = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: glowCount }, () => new THREE.Vector3((Math.random()-0.5)*60, (Math.random()-0.5)*60, (Math.random()-0.5)*60))
      ),
      new THREE.PointsMaterial({ color: 0xfbbf24, size: 1.5, map: app.getGlowTexture(), transparent: true, depthWrite: false, opacity: 0.5, blending: THREE.AdditiveBlending })
    );
    group.add(glow);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, 50, 0xf59e0b, 1800);
};

app.createBlackHole = function () {
    const group = new THREE.Group();
    group.name = 'Sagittarius A*';
    group.position.set(26000, 0, 0);

    const loader = new THREE.GLTFLoader();
    loader.load('asset3D/object/black_hole.glb', (gltf) => {
      const bhModel = gltf.scene;
      bhModel.traverse((child) => {
        if (child.isMesh) {
          child.name = 'Sagittarius A*';
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      bhModel.scale.setScalar(1.0);
      group.add(bhModel);
    }, undefined, (err) => {
      console.error('Gagal memuat model black_hole.glb:', err);
      // Fallback ke sphere prosedural jika model gagal dimuat
      const segs = app.getSegmentCount(64);
      const hole = new THREE.Mesh(
        new THREE.SphereGeometry(6, segs, segs),
        new THREE.MeshBasicMaterial({ color: 0x000000 })
      );
      group.add(hole);
    });

    const accretionDisk = new THREE.Mesh(
      new THREE.RingGeometry(7, 16, app.getSegmentCount(64)),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    );
    accretionDisk.rotation.x = Math.PI / 2;
    group.add(accretionDisk);

    const glowSegs = app.getSegmentCount(64);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(9, glowSegs, glowSegs),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(glow);

    const distortionSegs = app.getSegmentCount(64);
    const distortion = new THREE.Mesh(
      new THREE.SphereGeometry(13, distortionSegs, distortionSegs),
      new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true, opacity: 0.3, side: THREE.BackSide, depthWrite: false })
    );
    group.add(distortion);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, 17, 0xffaa00, 1500);
};

app.createGiantStar = function (name, color, radius, pos) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(pos.x, pos.y, pos.z);

    const segs = app.getSegmentCount(64);
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(radius, segs, segs),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, roughness: 0.4, metalness: 0.1 })
    );
    group.add(star);

    const corona = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.4, segs, segs),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(corona);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, radius * 1.4, color, 1600);
};

app.createEllipticalGalaxy = function (name, color, radius, pos) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(pos.x, pos.y, pos.z);

    const segs = app.getSegmentCount(64);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.4, segs, segs),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.5, roughness: 0.3, metalness: 0.1 })
    );
    group.add(core);

    const haloCount = app.getParticleCount(8000);
    const halo = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: haloCount }, () => {
          const r = Math.random() * radius;
          const a = Math.random() * Math.PI * 2;
          const z = (Math.random() - 0.5) * radius * 0.3;
          return new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.4, z);
        })
      ),
      new THREE.PointsMaterial({ color, size: 1.2, map: app.getGlowTexture(), transparent: true, depthWrite: false, opacity: 0.5, blending: THREE.AdditiveBlending })
    );
    group.add(halo);

    const glowSegs = app.getSegmentCount(64);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.8, glowSegs, glowSegs),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.25, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    group.add(glow);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, radius, color, 3000);
};

app.createSupercluster = function (name, color, radius, pos) {
    const group = new THREE.Group();
    group.name = name;
    group.position.set(pos.x, pos.y, pos.z);

    const segs = app.getSegmentCount(64);
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.15, segs, segs),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, roughness: 0.3, metalness: 0.1 })
    );
    group.add(center);

    const filaments = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 15000 }, () => {
          const r = Math.random() * radius;
          const a = Math.random() * Math.PI * 2;
          const b = Math.random() * Math.PI;
          return new THREE.Vector3(
            Math.sin(b) * Math.cos(a) * r,
            Math.sin(b) * Math.sin(a) * r,
            Math.cos(b) * r
          );
        })
      ),
      new THREE.PointsMaterial({ color, size: 0.8, map: app.getGlowTexture(), transparent: true, depthWrite: false, opacity: 0.4, blending: THREE.AdditiveBlending })
    );
    group.add(filaments);

    app.scene.add(group);
    app.celestialNodes.push(group);
    app.addDistanceLOD(group, radius, color, 5000);
};

app.createGalaxyCenter = function () {
  const centerGroup = new THREE.Group();
  centerGroup.name = 'Galaxy Center';
  centerGroup.position.set(0, 0, 0);
  app.scene.add(centerGroup);
  app.celestialNodes.push(centerGroup);
};

app.createProceduralSpaceships = function () {
  app.activeShipGroup = new THREE.Group();
  const shipFillLight = new THREE.PointLight(0xdbeafe, 5, 50);
  shipFillLight.position.set(0, 4, 5);
  app.shipFillLight = shipFillLight;
  app.activeShipGroup.add(shipFillLight);
  app.scene.add(app.activeShipGroup);

  const shipLoader = new THREE.GLTFLoader();
  const fitShipModel = (model, maxSize) => {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = maxSize / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(scale);
    model.position.copy(center).multiplyScalar(-scale);
  };

  // Muat model Recon
  shipLoader.load('asset3D/spaceship/space_ship.glb', (gltf) => {
    const reconModel = gltf.scene;
    reconModel.traverse((child) => {
      if (child.isMesh) {
        child.name = 'recon';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    reconModel.scale.setScalar(1.6);
    app.shipMeshMap['recon'] = reconModel;
    if (!app.activeShipGroup.children.includes(reconModel)) {
      app.activeShipGroup.add(reconModel);
    }
  }, undefined, (err) => {
    console.error('Gagal memuat model space_ship.glb:', err);
    const reconGroup = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.1, 3.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.15 })
    );
    body.rotation.x = Math.PI / 2;
    reconGroup.add(body);

    const wings = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.06, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.2 })
    );
    wings.position.set(0, 0, -0.3);
    reconGroup.add(wings);

    const thruster = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, 0.7, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    thruster.rotation.x = Math.PI / 2;
    thruster.position.set(0, 0, -1.9);
    reconGroup.add(thruster);
    reconGroup.scale.setScalar(1.6);

    app.shipMeshMap['recon'] = reconGroup;
    if (!app.activeShipGroup.children.includes(reconGroup)) {
      app.activeShipGroup.add(reconGroup);
    }
  });

  // Muat model Heavy Space Ship
  shipLoader.load('asset3D/spaceship/heavy space ship.glb', (gltf) => {
    const heavyModel = gltf.scene;
    heavyModel.traverse((child) => {
      if (child.isMesh) {
        child.name = 'heavy';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    fitShipModel(heavyModel, 8);
    app.shipMeshMap['heavy'] = heavyModel;
  }, undefined, (err) => {
    console.error('Gagal memuat model heavy space ship.glb:', err);
    const heavyGroup = new THREE.Group();
    const hull = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 6.0),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 })
    );
    heavyGroup.add(hull);
    fitShipModel(heavyGroup, 8);
    app.shipMeshMap['heavy'] = heavyGroup;
  });

  // Muat model UFO
  shipLoader.load('asset3D/spaceship/ufo.glb', (gltf) => {
    const ufoModel = gltf.scene;
    ufoModel.traverse((child) => {
      if (child.isMesh) {
        child.name = 'ufo';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    fitShipModel(ufoModel, 5);
    app.shipMeshMap['ufo'] = ufoModel;
  }, undefined, (err) => {
    console.error('Gagal memuat model ufo.glb:', err);
    const ufoGroup = new THREE.Group();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 3, 0.7, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.05 })
    );
    ufoGroup.add(disc);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transmission: 0.75, transparent: true, roughness: 0 })
    );
    dome.position.y = 0.3;
    ufoGroup.add(dome);
    ufoGroup.add(new THREE.PointLight(0x22c55e, 4, 10));
    fitShipModel(ufoGroup, 5);

    app.shipMeshMap['ufo'] = ufoGroup;
  });

  // Muat cockpit Recon
  shipLoader.load('asset3D/spaceship/cockpit recon.glb', (gltf) => {
    const cockpit = gltf.scene;
    cockpit.traverse((child) => {
      if (child.isMesh) {
        child.name = 'cockpitRecon';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    fitShipModel(cockpit, 1.0);
    app.shipMeshMap['cockpitRecon'] = cockpit;
  }, undefined, (err) => {
    console.error('Gagal memuat model cockpit recon.glb:', err);
  });

  // Muat cockpit Heavy Space Ship
  shipLoader.load('asset3D/spaceship/cockpit heavy.glb', (gltf) => {
    const cockpit = gltf.scene;
    cockpit.traverse((child) => {
      if (child.isMesh) {
        child.name = 'cockpitHeavy';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    fitShipModel(cockpit, 1.0);
    app.shipMeshMap['cockpitHeavy'] = cockpit;
  }, undefined, (err) => {
    console.error('Gagal memuat model cockpit heavy.glb:', err);
  });

  // Muat cockpit UFO
  shipLoader.load('asset3D/spaceship/ufo cockpit.glb', (gltf) => {
    const cockpit = gltf.scene;
    cockpit.traverse((child) => {
      if (child.isMesh) {
        child.name = 'cockpitUFO';
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    fitShipModel(cockpit, 1.0);
    app.shipMeshMap['cockpitUFO'] = cockpit;
  }, undefined, (err) => {
    console.error('Gagal memuat model ufo cockpit.glb:', err);
  });

  // Recon sudah ditambahkan ke activeShipGroup di dalam callback loader (baris 808-810)
  // Jangan menambahkan di sini karena GLTF load bersifat async dan shipMeshMap['recon']
  // masih undefined saat baris ini dieksekusi (menyebabkan error THREE.Object3D.add undefined)
};

app.setupInput = function () {
  window.addEventListener('keydown', (e) => { app.keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { app.keys[e.code] = false; });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') app.toggleUI();
  });
};
