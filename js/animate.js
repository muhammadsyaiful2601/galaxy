const cockpitViewTransforms = {
  recon: { scale: 2, rotationY: Math.PI, position: [0, 0.1, 0] },
  heavy: { scale: 2, rotationY: Math.PI, position: [0, 0, 0] },
  ufo: { scale: 2, rotationY: Math.PI, position: [0, 0, 0] },
};

app.animate = function () {
  requestAnimationFrame(app.animate);
  const delta = app.clock.getDelta();
  const elapsedTime = app.clock.elapsedTime;

  // FPS monitoring for dynamic quality adjustment
  app.fpsFrames++;
  app.fpsTime += delta;
  if (app.fpsTime >= 1.0) {
    app.fps = app.fpsFrames / app.fpsTime;
    app.fpsFrames = 0;
    app.fpsTime = 0;
    // Auto-downgrade quality if FPS consistently low
    if (app.fps < 30 && app.qualityLevel !== 'low' && !app.lodDisabled) {
      app.qualityLevel = 'low';
      app.lodEnabled = true;
      app.showToast('PERFORMANCE: Mode hemat daya diaktifkan');
    }
  }

  if (app.galaxyParticles) {
    app.galaxyParticles.rotation.y = elapsedTime * 0.012;
  }
  if (app.starfieldParticles) {
    app.starfieldParticles.position.copy(app.camera.position);

    if (app.isWarping) {
      // Efek warp: bintang meregang membentuk garis ke arah gerak kamera
      const stretch = 1 + (app.clock.getElapsedTime() % 1) * 6;
      app.starfieldParticles.scale.set(1, 1, stretch);
      app.starfieldParticles.rotation.y = -elapsedTime * 0.04;
      app.starfieldParticles.rotation.x = Math.sin(elapsedTime * 0.5) * 0.1;

      // Tampilkan kecepatan super di HUD saat warp
      const speedHUD = document.getElementById('hud-speed');
      if (speedHUD) {
        const warpSpeed = 999 + Math.sin(elapsedTime * 10) * 50;
        speedHUD.innerText = warpSpeed.toFixed(1) + ' LY/s';
        speedHUD.className = 'font-orbitron text-amber-400 font-bold text-xs animate-pulse';
      }
    } else {
      app.starfieldParticles.scale.set(1, 1, 1);
      app.starfieldParticles.rotation.y = -elapsedTime * 0.004;
      app.starfieldParticles.rotation.x = 0;

      const speedHUD = document.getElementById('hud-speed');
      if (speedHUD) {
        speedHUD.innerText = '0.00 LY/s';
        speedHUD.className = 'font-orbitron text-slate-300 font-bold text-xs';
      }
    }
  }

  app.orbits.forEach((o) => {
    o.angle += o.speed * 0.4;
    o.group.position.x = Math.cos(o.angle) * o.radius;
    o.group.position.z = Math.sin(o.angle) * o.radius;
    o.group.rotation.y += 0.006;
    if (o.group.userData && o.group.userData.cloudMesh) {
      o.group.userData.cloudMesh.rotation.y = elapsedTime * 0.06;
      o.group.userData.cloudMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.03;
    }
  });

  // Throttle celestial animations on low-quality devices
  const doCulling = app.qualityLevel !== 'low' || Math.floor(elapsedTime * 2) % 2 === 0;
  if (doCulling) {
    app.celestialNodes.forEach((node) => {
      if (node.userData && node.userData.dist) {
        node.userData.angle += node.userData.speed;
        node.userData.group.position.x = Math.cos(node.userData.angle) * node.userData.dist;
        node.userData.group.position.z = Math.sin(node.userData.angle) * node.userData.dist;
        node.userData.group.rotation.y += 0.008;
      }
      if (node.name === 'Sun') {
        node.rotation.y += 0.003;
      }
      if (['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(node.name)) {
        node.rotation.y += 0.005;
      }
    });
  }

  if (app.autonomousUFO && app.ufoState) {
    const delta = app.clock.getDelta();
    const ufo = app.autonomousUFO;
    const state = app.ufoState;

    // Hitung timer pergantian target
    state.changeTimer += delta;

    // Pilih target baru jika timer habis atau sudah cukup dekat ke target saat ini
    if (!state.currentTarget || state.changeTimer >= state.changeInterval || ufo.position.distanceTo(state.currentTarget) < 5) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI / 3; // -30 to +30 derajat
      const dist = state.wanderRadius * (0.5 + Math.random());

      state.currentTarget = new THREE.Vector3(
        state.homePosition.x + Math.cos(angle) * Math.cos(elevation) * dist,
        state.homePosition.y + Math.sin(elevation) * dist * 0.5,
        state.homePosition.z + Math.sin(angle) * Math.cos(elevation) * dist
      );
      state.changeTimer = 0;
      state.changeInterval = 3 + Math.random() * 5; // 3-8 detik
    }

    // Gerak ke arah target
    const dir = new THREE.Vector3().subVectors(state.currentTarget, ufo.position);
    const dist = dir.length();

    if (dist > 0.1) {
      dir.normalize();
      ufo.position.addScaledVector(dir, state.speed * delta);

      // Rotasi UFO menghadap arah gerak (hanya sumbu Y)
      const targetRotation = Math.atan2(dir.x, dir.z);
      ufo.rotation.y += (targetRotation - ufo.rotation.y) * 0.1;
    }

    // Tilting halus berdasarkan arah gerak
    const tilt = dir.clone().normalize().y * 0.3;
    ufo.rotation.x += (tilt - ufo.rotation.x) * 0.05;
  }

  if (app.followTarget && !app.isWarping) {
    app.followTarget.getWorldPosition(app._lodCenter);
    app._targetMovement.subVectors(app._lodCenter, app.followTargetPosition);
    app.camera.position.add(app._targetMovement);
    app.controls.target.add(app._targetMovement);
    app.followTargetPosition.copy(app._lodCenter);
  }

  // WASD movement vector
  const moveVec = new THREE.Vector3();
  if (app.keys['KeyW']) moveVec.z -= 1;
  if (app.keys['KeyS']) moveVec.z += 1;
  if (app.keys['KeyA']) moveVec.x -= 1;
  if (app.keys['KeyD']) moveVec.x += 1;

  // WASD movement — kecepatan bervariasi menurut tipe spaceship
  const moveSpeed = app.shipSpeedMap ? app.shipSpeedMap[app.currentShipType] || 30 : 30;

  if (moveVec.lengthSq() > 0) {
    moveVec.normalize().multiplyScalar(moveSpeed * delta);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(app.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(app.camera.quaternion);
    const offset = forward.clone().multiplyScalar(-moveVec.z).add(right.clone().multiplyScalar(moveVec.x));
    app.camera.position.add(offset);
    app.controls.target.add(offset);

    if (app.audio && typeof app.audio.playEngine === 'function') {
      app.audio.playEngine(true);
    }
  } else {
    if (app.audio && typeof app.audio.playEngine === 'function') {
      app.audio.playEngine(false);
    }
  }

  // Keyboard shortcut untuk pergantian kapal (1=Recon, 2=Heavy, 3=UFO)
  const now = Date.now();
  if (!app._shipSwitchCooldown || now - app._shipSwitchCooldown > 500) {
    if (app.keys['Key1']) {
      selectShip('recon');
      app._shipSwitchCooldown = now;
    } else if (app.keys['Key2']) {
      selectShip('heavy');
      app._shipSwitchCooldown = now;
    } else if (app.keys['Key3']) {
      selectShip('ufo');
      app._shipSwitchCooldown = now;
    }
  }

  // Cockpit visibility untuk mode 1st person
  const cockpitMap = {
    recon: 'cockpitRecon',
    heavy: 'cockpitHeavy',
    ufo: 'cockpitUFO',
  };
  const cockpitKey = cockpitMap[app.currentShipType];
  const cockpitMesh = cockpitKey && app.shipMeshMap[cockpitKey];

  const cockpitReady = cockpitMesh && cockpitMesh.isObject3D;
  const needsCockpit = app.currentViewMode === '1st' && cockpitReady;
  const cockpitChanged = app._cockpitKey !== cockpitKey;

  if (!needsCockpit || !app._cockpitAttached || cockpitChanged) {
    if (app._cockpitMesh) {
      app.camera.remove(app._cockpitMesh);
      app._cockpitMesh = null;
    }
    app._cockpitAttached = false;
    app._cockpitKey = null;

    if (needsCockpit) {
      const cockpitClone = cockpitMesh.clone();
      const cockpitTransform = cockpitViewTransforms[app.currentShipType];
      cockpitClone.scale.multiplyScalar(cockpitTransform.scale);
      cockpitClone.rotation.y = cockpitTransform.rotationY;
      cockpitClone.position.set(...cockpitTransform.position);
      app.camera.add(cockpitClone);
      app._cockpitMesh = cockpitClone;
      app._cockpitAttached = true;
      app._cockpitKey = cockpitKey;
    }
  }

  if (app.activeShipGroup) {
    app.activeShipGroup.visible = app.currentViewMode === '3rd';
  }

  if (app.activeShipGroup && app.currentViewMode !== 'free' && !app.isAligning) {
    if (app.currentViewMode === '3rd') {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(app.camera.quaternion);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(app.camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(app.camera.quaternion);
      app.activeShipGroup.position.copy(app.camera.position)
        .addScaledVector(forward, 14)
        .addScaledVector(up, -3);
      app.activeShipGroup.quaternion.copy(app.camera.quaternion);
      app.activeShipGroup.rotateY(Math.PI);
    } else if (app.currentViewMode === '1st') {
      app.activeShipGroup.position.copy(app.camera.position);
      app.activeShipGroup.quaternion.copy(app.camera.quaternion);
      app.activeShipGroup.rotateY(Math.PI);
    }
  }

  if (app.activeTarget) {
    const targetWorldPos = new THREE.Vector3();
    app.activeTarget.getWorldPosition(targetWorldPos);
    const dist = app.camera.position.distanceTo(targetWorldPos);
    document.getElementById('hud-distance').innerText = Math.round(dist * 10) + ' AU';
  }

  if (app.currentViewMode === '1st') {
    app.camera.getWorldDirection(app._lookDirection);
    app.controls.target.copy(app.camera.position).addScaledVector(app._lookDirection, 100);
  } else {
    app.controls.update();
  }
  app.camera.updateMatrixWorld();
  app.frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(app.camera.projectionMatrix, app.camera.matrixWorldInverse));

  app.distanceLODNodes.forEach((entry) => {
    const { node, radius, detailDistance, sprite } = entry;
    node.getWorldPosition(app._lodCenter);
    const inFrustum = app.frustum.intersectsSphere(app._lodSphere.set(app._lodCenter, radius));
    node.visible = inFrustum;
    if (!inFrustum) return;

    const useSprite = app.camera.position.distanceTo(app._lodCenter) >= detailDistance;
    node.children.forEach((child) => {
      if (child !== sprite) child.visible = !useSprite;
    });
    sprite.visible = useSprite;
  });

  app.renderer.render(app.scene, app.camera);
};
