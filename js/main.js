window.onload = function () {
  app.initEngine();
  app.setupRaycaster();
  app.createSpiralGalaxy();
  app.createStarfield();
  app.createWarpTunnel();
  app.createNebula();
  app.createSolarSystem();
  app.createGalaxyCenter();
  app.createAutonomousUFO();
  app.createAndromeda();
  app.createTriangulum();
  app.createSombrero();
  app.createTheVoid();
  app.createPillarsOfCreation();
  app.createBlackHole();
  app.createGiantStar('Stephenson 2-18', 0xffb347, 28, { x: 799500, y: 25000, z: -600000 });
  app.createGiantStar('UY Scuti', 0xff9aa2, 24, { x: -930500, y: -40000, z: 710000 });
  app.createGiantStar('VY Canis Majoris', 0xffd166, 22, { x: 409500, y: 105000, z: -990000 });
  app.createGiantStar('R136a1', 0x00ffff, 20, { x: -1550500, y: 600000, z: 750000 });
  app.createGiantStar('Pistol Star', 0x00aaff, 25, { x: 1124500, y: 6000, z: 45000 });
  app.createEllipticalGalaxy('IC 1101', 0xffd700, 90, { x: 2099500, y: -1500000, z: 1100000 });
  app.createSupercluster('Hercules-Corona Borealis', 0x8b5cf6, 120, { x: -3150500, y: 2000000, z: -2500000 });
  app.createProceduralSpaceships();

  // Spawn bos-bos luar tata surya (sangat jauh dari Neptunus 0,0,0)
  app.createArgusBoss();
  app.createMothershipBoss();
  app.createTankAlienBoss();

  // Initialize audio and start ambient MP3
  app.audio.init();
  app.audio.initAmbient();

  // Wire up volume/mute controls
  const volInput = document.getElementById('audio-volume');
  const muteBtn = document.getElementById('btn-audio-mute');
  if (volInput) {
    volInput.addEventListener('input', (e) => {
      app.audio.setVolume(parseFloat(e.target.value));
    });
  }
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const muted = app.audio.toggleMute();
      muteBtn.innerHTML = muted ? '<i class="fa-solid fa-volume-mute"></i>' : '<i class="fa-solid fa-volume-up"></i>';
      muteBtn.classList.toggle('bg-slate-600', muted);
      muteBtn.classList.toggle('text-slate-400', muted);
    });
  }

  app.clock = new THREE.Clock();

  app.animate();
  app.selectTargetByName('Sun');
};

window.cdnLoadFailed = function (name) {
  console.error('CDN load failed: ' + name);
  const msg = document.createElement('div');
  msg.style.position = 'fixed';
  msg.style.top = '50%';
  msg.style.left = '50%';
  msg.style.transform = 'translate(-50%, -50%)';
  msg.style.background = '#7f1d1d';
  msg.style.color = '#fff';
  msg.style.padding = '20px';
  msg.style.border = '2px solid #dc2626';
  msg.style.borderRadius = '8px';
  msg.style.zIndex = '99999';
  msg.style.fontFamily = 'monospace';
  msg.innerText = 'Gagal memuat ' + name + ' dari CDN. Periksa koneksi internet dan coba muat ulang halaman.';
  document.body.appendChild(msg);
};

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  app.camera.aspect = window.innerWidth / window.innerHeight;
  app.camera.updateProjectionMatrix();
  app.renderer.setSize(window.innerWidth, window.innerHeight);
}
