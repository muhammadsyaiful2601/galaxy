let raycaster, mouse;

app.setupRaycaster = function () {
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('click', onPointerClick);
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  const canvas = app.renderer.domElement;
  canvas.addEventListener('pointerdown', (event) => {
    if (app.currentViewMode !== '1st' || event.button !== 0) return;

    app._lookDragActive = true;
    app._lookDragMoved = false;
    app._lookLastPointer = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!app._lookDragActive || app.currentViewMode !== '1st' || !app._lookLastPointer) return;

    const deltaX = event.clientX - app._lookLastPointer.x;
    const deltaY = event.clientY - app._lookLastPointer.y;
    app._lookLastPointer = { x: event.clientX, y: event.clientY };
    if (Math.abs(deltaX) + Math.abs(deltaY) > 0) app._lookDragMoved = true;

    const lookSensitivity = 0.003;
    app.lookYaw -= deltaX * lookSensitivity;
    app.lookPitch = THREE.MathUtils.clamp(
      app.lookPitch - deltaY * lookSensitivity,
      -Math.PI / 2 + 0.05,
      Math.PI / 2 - 0.05
    );
    app.camera.quaternion.setFromEuler(new THREE.Euler(app.lookPitch, app.lookYaw, 0, 'YXZ'));
  });
  const stopLooking = (event) => {
    app._lookDragActive = false;
    app._lookLastPointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (app._lookDragMoved) {
      window.setTimeout(() => {
        app._lookDragMoved = false;
      }, 0);
    }
  };
  canvas.addEventListener('pointerup', stopLooking);
  canvas.addEventListener('pointercancel', stopLooking);
};

function onPointerMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, app.camera);
  const intersects = raycaster.intersectObjects(app.celestialNodes, true);

  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
    document.getElementById('crosshair').classList.add('scale-110', 'border-slate-300');
  } else {
    document.body.style.cursor = 'crosshair';
    document.getElementById('crosshair').classList.remove('scale-110', 'border-slate-300');
  }
}

function onPointerClick(event) {
  if (app._lookDragMoved) {
    app._lookDragMoved = false;
    return;
  }
  if (event.target.closest('.hud-panel') || event.target.closest('button')) return;

  raycaster.setFromCamera(mouse, app.camera);
  const intersects = raycaster.intersectObjects(app.celestialNodes, true);

  if (intersects.length > 0) {
    let hitObj = intersects[0].object;
    while (hitObj.parent && hitObj.parent !== app.scene) {
      hitObj = hitObj.parent;
    }
    app.selectTargetObject(hitObj);
  }
}

app.selectTargetObject = function (targetObj) {
  app.activeTarget = targetObj;
  app.followTarget = null;
  const name = targetObj.name || 'Galaxy Center';
  app.updateHUDTargetInfo(name);
  app.showToast('TARGET LOCKED: ' + name.toUpperCase());
  if (app.audio && typeof app.audio.playClick === 'function') {
    app.audio.playClick('lock');
  }
};

app.selectTargetByName = function (name) {
  const found = app.celestialNodes.find((n) => n.name === name);
  if (found) app.selectTargetObject(found);
};

app.flyToNodeByName = function (name) {
  app.selectTargetByName(name);
  app.warpToCurrentTarget();
};

app.warpToCurrentTarget = function (customDuration = null) {
  if (!app.activeTarget || app.isWarping || app.isAligning || app.isCountdown) return;

  app.warpTarget = app.activeTarget;
  const targetPos = new THREE.Vector3();
  app.warpTarget.getWorldPosition(targetPos);
  const currentDist = app.camera.position.distanceTo(targetPos);

  // Distance validation: reject if too close (< 8 units) or too far (> max range)
  const MIN_WARP_DIST = 8;
  const MAX_WARP_DIST = 200000;
  if (currentDist < MIN_WARP_DIST) {
    app.showToast('WARP BLOCKED: Target terlalu dekat (min ' + MIN_WARP_DIST + ' unit)');
    return;
  }
  if (currentDist > MAX_WARP_DIST) {
    app.showToast('WARP BLOCKED: Jarak terlalu jauh (max ' + MAX_WARP_DIST + ' unit)');
    return;
  }

  app.audio.playClick('warp-btn');
  app.audio.playWarpFile();

  // Siapkan elemen UI warp
  const overlay = document.getElementById('warp-overlay');
  const tunnel = document.getElementById('warp-tunnel');
  const progressContainer = document.getElementById('warp-progress-container');
  const progressBar = document.getElementById('warp-progress-bar');
  const cancelBtn = document.getElementById('btn-cancel-warp');

  overlay.style.opacity = '1';
  tunnel.style.opacity = '1';
  progressContainer.style.opacity = '1';
  cancelBtn.style.opacity = '1';
  cancelBtn.style.pointerEvents = 'auto';

  // ============================================================
  // FASE 1: Alignment — putar spaceship DAN kamera menghadap target
  // ============================================================
  app.isAligning = true;
  app.controls.enabled = false;
  app.showToast('MENGARAH KE ' + app.warpTarget.name.toUpperCase() + '...');

  const startShipQuat = app.activeShipGroup ? app.activeShipGroup.quaternion.clone() : new THREE.Quaternion();
  const startCamQuat = app.camera.quaternion.clone();

  // Hitung arah ke target (hanya bidang XZ, tanpa miring ke atas/bawah)
  const dir = new THREE.Vector3().subVectors(targetPos, app.camera.position);
  dir.y = 0;
  if (dir.lengthSq() > 0.0001) {
    dir.normalize();
  } else {
    dir.copy(new THREE.Vector3(0, 0, -1));
  }

  const targetQuat = new THREE.Quaternion();
  targetQuat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);

  const alignProgress = { value: 0 };
  const ALIGN_DURATION = 1.5;

  app.currentAlignTween = gsap.to(alignProgress, {
    value: 1,
    duration: ALIGN_DURATION,
    ease: 'power2.inOut',
    onUpdate: () => {
      // Rotasi spaceship
      if (app.activeShipGroup) {
        app.activeShipGroup.quaternion.slerpQuaternions(startShipQuat, targetQuat, alignProgress.value);
      }
      // Rotasi kamera mengikuti arah target
      app.camera.quaternion.slerpQuaternions(startCamQuat, targetQuat, alignProgress.value);
      app.camera.updateMatrixWorld();
      // Update controls.target agar mengikuti arah pandang kamera
      const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(app.camera.quaternion);
      app.controls.target.copy(app.camera.position).add(camForward.multiplyScalar(100));
    },
    onComplete: () => {
      app.isAligning = false;
      app.currentAlignTween = null;
      startCountdown();
    }
  });

  // ============================================================
  // FASE 2: Countdown 3 detik sebelum warp dimulai
  // ============================================================
  function startCountdown() {
    app.isCountdown = true;
    let countdownValue = 3;

    app.currentCountdownInterval = setInterval(() => {
      if (!app.isCountdown) {
        clearInterval(app.currentCountdownInterval);
        app.currentCountdownInterval = null;
        return;
      }
      if (countdownValue > 0) {
        app.showToast('WARPING AKAN DIMULAI DALAM ' + countdownValue + ' DETIK');
        countdownValue--;
      } else {
        clearInterval(app.currentCountdownInterval);
        app.currentCountdownInterval = null;
        app.isCountdown = false;
        startWarpPhase();
      }
    }, 1000);

    // Tampilkan detik pertama segera
    app.showToast('WARPING AKAN DIMULAI DALAM ' + countdownValue + ' DETIK');
    countdownValue--;
  }

  // ============================================================
  // FASE 3: Warp — efek visual dan pergerakan kamera
  // ============================================================
  function startWarpPhase() {
    app.isWarping = true;
    app.isCountdown = false;

    // Inisialisasi warp tunnel 3D jika belum ada
    if (app.warpTunnel) {
      app.warpTunnel.visible = true;
    } else if (typeof app.createWarpTunnel === 'function') {
      app.createWarpTunnel();
      if (app.warpTunnel) app.warpTunnel.visible = true;
    }

    // Store reference for cancel
    const startCamera = app.camera.position.clone();
    const startControlsTarget = app.controls.target.clone();
    const destinationCam = new THREE.Vector3();
    const warpProgress = { value: 0 };

    app.controls.enabled = false;
    app.warpProgress = 0;
    app.warpBaseFov = app.camera.fov;

    const cameraOffset = app.camera.position.clone().sub(targetPos);
    if (cameraOffset.lengthSq() === 0) {
      cameraOffset.set(22, 18, 36);
    }
    cameraOffset.setLength(Math.max(50, Math.min(cameraOffset.length(), 90)));

    let duration = customDuration;
    if (!duration) {
      duration = Math.max(2.6, Math.min(60, currentDist * 0.006));
    }

    app.currentWarpTL = gsap.timeline({
      onComplete: () => {
        app.finishWarp(true);
      }
    });

    app.currentWarpTL.to(warpProgress, {
      value: 1,
      duration: duration,
      ease: 'power3.inOut',
      onUpdate: () => {
        app.warpProgress = warpProgress.value;
        app.warpTarget.getWorldPosition(targetPos);
        app.controls.target.copy(startControlsTarget).lerp(targetPos, warpProgress.value);
        destinationCam.copy(targetPos).add(cameraOffset);
        app.camera.position.copy(startCamera).lerp(destinationCam, warpProgress.value);
      }
    }, 0);

    // Animate progress bar
    app.currentWarpProgressTween = gsap.to(progressBar, {
      width: '100%',
      duration: duration,
      ease: 'none'
    });

  }
};

app.cancelWarp = function () {
  if (!app.isWarping && !app.isAligning && !app.isCountdown) return;

  app.audio.playClick('ui');
  app.audio.stopWarpFile();

  // Kill countdown interval jika sedang fase countdown
  if (app.isCountdown) {
    app.isCountdown = false;
    if (app.currentCountdownInterval) {
      clearInterval(app.currentCountdownInterval);
      app.currentCountdownInterval = null;
    }
  }

  // Kill alignment tween jika sedang fase alignment
  if (app.isAligning) {
    app.isAligning = false;
    if (app.currentAlignTween) {
      app.currentAlignTween.kill();
      app.currentAlignTween = null;
    }
  }

  if (app.currentWarpTL) {
    app.currentWarpTL.kill();
    app.currentWarpTL = null;
  }
  if (app.currentWarpProgressTween) {
    app.currentWarpProgressTween.kill();
    app.currentWarpProgressTween = null;
  }

  // Reset state warping agar bisa warp lagi
  app.isWarping = false;
  app.warpProgress = 0;
  app.warpTarget = null;
  app.isAligning = false;
  app.isCountdown = false;

  // Sembunyikan warp tunnel 3D
  if (app.warpTunnel) app.warpTunnel.visible = false;

  // Sembunyikan UI warp
  const overlay = document.getElementById('warp-overlay');
  const tunnel = document.getElementById('warp-tunnel');
  const progressContainer = document.getElementById('warp-progress-container');
  const progressBar = document.getElementById('warp-progress-bar');
  const cancelBtn = document.getElementById('btn-cancel-warp');
  if (overlay) overlay.style.opacity = '0';
  if (tunnel) tunnel.style.opacity = '0';
  if (progressContainer) progressContainer.style.opacity = '0';
  if (progressBar) progressBar.style.width = '0%';
  if (cancelBtn) {
    cancelBtn.style.opacity = '0';
    cancelBtn.style.pointerEvents = 'none';
  }

  app.controls.enabled = app.currentViewMode !== '1st';
  app.showToast('WARP DIBATALKAN');
  return;
};

app.finishWarp = function (arrived = true) {
  const arrivalTarget = app.warpTarget || app.activeTarget;
  app.isWarping = false;
  app.warpProgress = 0;
  app.isAligning = false;
  app.isCountdown = false;
  app.warpTarget = null;
  app.audio.stopWarpFile();
  app.currentWarpTL = null;

  // Sembunyikan warp tunnel 3D
  if (app.warpTunnel) app.warpTunnel.visible = false;

  const overlay = document.getElementById('warp-overlay');
  const tunnel = document.getElementById('warp-tunnel');
  const progressContainer = document.getElementById('warp-progress-container');
  const progressBar = document.getElementById('warp-progress-bar');
  const cancelBtn = document.getElementById('btn-cancel-warp');

  overlay.style.opacity = '0';
  tunnel.style.opacity = '0';
  progressContainer.style.opacity = '0';
  progressBar.style.width = '0%';
  if (app.currentWarpProgressTween) {
    app.currentWarpProgressTween.kill();
    app.currentWarpProgressTween = null;
  }
  cancelBtn.style.opacity = '0';
  cancelBtn.style.pointerEvents = 'none';

  if (arrived && arrivalTarget) {
    arrivalTarget.getWorldPosition(app.controls.target);
    app.followTarget = arrivalTarget;
    app.followTargetPosition.copy(app.controls.target);
  } else {
    app.followTarget = null;
    const lookDirection = new THREE.Vector3();
    app.camera.getWorldDirection(lookDirection);
    app.controls.target.copy(app.camera.position).add(lookDirection.multiplyScalar(100));
  }
  app.controls.enabled = app.currentViewMode !== '1st';

  // Show target popup if we have a target
  if (arrived && arrivalTarget) {
    app.showToast('ARRIVED AT ' + arrivalTarget.name.toUpperCase());
    app.showPlanetPopup(arrivalTarget.name || 'Galaxy Center');
  }
};

app.resetCameraView = function () {
  app.selectTargetByName('Galaxy Center');
  app.warpToCurrentTarget();
};

app.selectShip = function (shipType) {
  if (app.currentShipType === shipType) return;

  // Guard: model belum termuat, abaikan pemilihan
  if (!app.shipMeshMap[shipType]) {
    app.showToast('MODEL SEDANG DIMUAT...');
    return;
  }

  document.querySelectorAll('.ship-card').forEach((btn) => {
    btn.classList.remove('active', 'border-slate-600/60', 'bg-slate-800/60');
    btn.classList.add('border-slate-700/60', 'bg-slate-900/50');
  });

  const btn = document.getElementById('btn-ship-' + shipType);
  if (btn) {
    btn.classList.add('active', 'border-slate-600/60', 'bg-slate-800/60');
  }

  app.activeShipGroup.children.slice().forEach((child) => {
    if (child !== app.shipFillLight) {
      app.activeShipGroup.remove(child);
    }
  });
  app.activeShipGroup.add(app.shipMeshMap[shipType]);
  app.currentShipType = shipType;

  app.audio.playClick('ship');
  app.audio.playShipSound(shipType);

  app.showToast('SPACECRAFT DEPLOYED: ' + shipType.toUpperCase());
};

app.setViewMode = function (mode) {
  const previousMode = app.currentViewMode;
  if (mode === '1st') {
    app.camera.rotation.order = 'YXZ';
    const lookRotation = new THREE.Euler().setFromQuaternion(app.camera.quaternion, 'YXZ');
    app.lookYaw = lookRotation.y;
    app.lookPitch = lookRotation.x;
    app.camera.quaternion.setFromEuler(new THREE.Euler(app.lookPitch, app.lookYaw, 0, 'YXZ'));
  } else if (previousMode === '1st') {
    const lookDirection = new THREE.Vector3();
    app.camera.getWorldDirection(lookDirection);
    app.controls.target.copy(app.camera.position).addScaledVector(lookDirection, 100);
  }
  app.currentViewMode = mode;

  ['3rd', '1st', 'free'].forEach((m) => {
    const btn = document.getElementById('view-' + m);
    btn.className = (m === mode)
      ? 'px-2 py-0.5 rounded-md text-[10px] font-orbitron text-slate-300 bg-white/10 font-bold transition-all'
      : 'px-2 py-0.5 rounded-md text-[10px] font-orbitron text-slate-500 hover:text-white transition-all';
  });
  document.getElementById('control-look-action').innerText = mode === '1st' ? 'Look' : 'Orbit';

  app.activeShipGroup.visible = mode === '3rd';
  if (mode === 'free') {
    app.audio.stopShipSound();
  } else {
    // Putar kembali sound kapal saat kembali dari mode free
    if (app.currentShipType && app.audio && typeof app.audio.playShipSound === 'function') {
      app.audio.playShipSound(app.currentShipType);
    }
  }
  app.controls.enabled = mode !== '1st' && !app.isWarping;

  app.audio.playClick('view');

  app.showToast('CAMERA VIEW MODE: ' + mode.toUpperCase());
};

app.updateHUDTargetInfo = function (name) {
  const data = CELESTIAL_DATA[name] || CELESTIAL_DATA['Galaxy Center'];

  document.getElementById('target-title').innerText = data.title;
  document.getElementById('target-desc').innerText = data.desc;
  document.getElementById('target-class').innerText = data.class;
  document.getElementById('target-size').innerText = data.size;
  document.getElementById('target-temp').innerText = data.temp;
  document.getElementById('target-satellites').innerText = data.satellites;

  document.getElementById('hud-target-name').innerText = name.toUpperCase();
};

app.showToast = function (text) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').innerText = text;

  toast.style.opacity = '1';
  gsap.killTweensOf(toast);
  gsap.to(toast, { opacity: 0, delay: 2.5, duration: 0.5 });
};

app.toggleWarpMenu = function () {
  const list = document.getElementById('warp-list');
  const chevron = document.querySelector('#warp-menu .fa-chevron-up');
  const isHidden = list.style.display === 'none';
  list.style.display = isHidden ? 'flex' : 'none';
  if (chevron) {
    chevron.className = isHidden ? 'fa-solid fa-chevron-up text-[9px]' : 'fa-solid fa-chevron-down text-[9px]';
  }
};

window.toggleWarpMenu = app.toggleWarpMenu;

// Panel collapse/minimize state
app.panelState = {};

app.togglePanel = function (panelId) {
  const panel = document.getElementById(panelId);
  const icon = document.getElementById('icon-' + panelId);
  const isCollapsed = panel.classList.contains('panel-collapsed');

  if (isCollapsed) {
    panel.classList.remove('panel-collapsed');
    if (icon) icon.className = 'fa-solid fa-chevron-up text-[9px]';
    app.panelState[panelId] = false;
  } else {
    panel.classList.add('panel-collapsed');
    if (icon) icon.className = 'fa-solid fa-chevron-down text-[9px]';
    app.panelState[panelId] = true;
  }
};

window.togglePanel = app.togglePanel;

app.showPlanetPopup = function (name) {
  const data = CELESTIAL_DATA[name] || CELESTIAL_DATA['Galaxy Center'];
  const popup = document.getElementById('planet-popup');
  document.getElementById('popup-title').innerText = data.title;
  document.getElementById('popup-fact').innerText = data.fact;
  document.getElementById('popup-class').innerText = data.class;
  document.getElementById('popup-size').innerText = data.size;
  document.getElementById('popup-temp').innerText = data.temp;
  document.getElementById('popup-sat').innerText = data.satellites;

  popup.style.opacity = '1';
  popup.style.pointerEvents = 'auto';
  popup.classList.remove('scale-95');
  popup.classList.add('scale-100');

  if (app.audio && typeof app.audio.playClick === 'function') {
    app.audio.playClick('ui');
  }
};

app.closePlanetPopup = function () {
  const popup = document.getElementById('planet-popup');
  popup.style.opacity = '0';
  popup.style.pointerEvents = 'none';
  popup.classList.remove('scale-100');
  popup.classList.add('scale-95');

  if (app.audio && typeof app.audio.playClick === 'function') {
    app.audio.playClick('ui');
  }
};

window.showPlanetPopup = app.showPlanetPopup;
window.closePlanetPopup = app.closePlanetPopup;

// Expose all handlers to window for inline HTML onclick
window.warpToCurrentTarget = app.warpToCurrentTarget;
window.flyToNodeByName = app.flyToNodeByName;
window.resetCameraView = app.resetCameraView;
window.selectShip = app.selectShip;
window.setViewMode = app.setViewMode;
window.cancelWarp = app.cancelWarp;
