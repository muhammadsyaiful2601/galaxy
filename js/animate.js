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
      const warpProgress = Math.max(0, Math.min(1, app.warpProgress || 0));
      const warpIntensity = Math.sin(warpProgress * Math.PI);
      app.starfieldParticles.scale.set(1, 1, 1);
      app.starfieldParticles.rotation.y = -elapsedTime * (0.004 + warpIntensity * 0.025);
      app.starfieldParticles.rotation.x = warpIntensity * 0.04;

      if (app.warpTunnel) {
        app.warpTunnel.visible = true;
        app.warpTunnel.position.copy(app.camera.position);
        app.warpTunnel.quaternion.copy(app.camera.quaternion);

        app.warpTunnel.children.forEach((child) => {
          if (child.userData && child.userData.speed) {
            child.position.z += child.userData.speed * (0.12 + warpIntensity * 2.4) * delta;
            if (child.position.z > 220) child.position.z = -220;
          }
        });

        if (app.warpTunnelParticles) {
          const positions = app.warpTunnelParticles.geometry.attributes.position.array;
          const { speeds, lengths, count, start, end } = app.warpTunnelParticles.userData;
          const speedScale = 0.2 + warpIntensity * 2.8;

          for (let i = 0; i < count; i++) {
            const offset = i * 6;
            positions[offset + 2] += speeds[i] * speedScale * delta;
            if (positions[offset + 2] > end) {
              positions[offset + 2] = start;
            }
            positions[offset + 5] = positions[offset + 2] - lengths[i];
          }
          app.warpTunnelParticles.geometry.attributes.position.needsUpdate = true;
          app.warpTunnelParticles.material.opacity = 0.3 + warpIntensity * 0.7;
        }

        const rails = app.warpTunnel.getObjectByName('Warp Tunnel Rails');
        if (rails) rails.material.opacity = 0.12 + warpIntensity * 0.35;
      }

      const speedHUD = document.getElementById('hud-speed');
      if (speedHUD) {
        const warpSpeed = 100 + warpIntensity * 9900;
        speedHUD.innerText = warpSpeed.toFixed(1) + ' LY/s';
        speedHUD.className = 'font-orbitron text-cyan-400 font-bold text-xs animate-pulse';
      }

      if (app.camera && app.warpBaseFov !== null) {
        const targetFov = app.warpBaseFov + warpIntensity * 18;
        if (Math.abs(app.camera.fov - targetFov) > 0.1) {
          app.camera.fov = targetFov;
          app.camera.updateProjectionMatrix();
        }
      }
    } else {
      app.starfieldParticles.scale.set(1, 1, 1);
      app.starfieldParticles.rotation.y = -elapsedTime * 0.004;
      app.starfieldParticles.rotation.x = 0;

      app.warpProgress = 0;
      if (app.camera && app.warpBaseFov !== null) {
        app.camera.fov = app.warpBaseFov;
        app.camera.updateProjectionMatrix();
        app.warpBaseFov = null;
      }

      if (app.warpTunnel) {
        app.warpTunnel.visible = false;
      }

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
    const ufo = app.autonomousUFO;
    const state = app.ufoState;

    state.wanderTimer -= delta;
    if (state.wanderTimer <= 0) {
      state.wanderDirection.set(
        Math.random() * 2 - 1,
        (Math.random() - 0.5) * 0.7,
        Math.random() * 2 - 1
      ).normalize();
      state.wanderTimer = 2 + Math.random() * 3;
    }

    const fromHome = state.toHome.subVectors(ufo.position, state.homePosition);
    const distanceFromHome = fromHome.length();
    const boundaryStrength = Math.min(
      1,
      Math.max(0, (distanceFromHome - state.wanderRadius * 0.65) / (state.wanderRadius * 0.35))
    );
    if (boundaryStrength > 0) {
      state.wanderDirection.lerp(
        fromHome.normalize().negate(),
        boundaryStrength * 0.08
      ).normalize();
    }

    state.desiredVelocity.copy(state.wanderDirection).multiplyScalar(state.speed);
    state.velocity.lerp(state.desiredVelocity, 1 - Math.exp(-0.8 * delta));
    ufo.position.addScaledVector(state.velocity, delta);

    const speed = state.velocity.length();
    if (speed > 0.1) {
      const targetRotation = Math.atan2(state.velocity.x, state.velocity.z);
      const headingDelta = Math.atan2(
        Math.sin(targetRotation - ufo.rotation.y),
        Math.cos(targetRotation - ufo.rotation.y)
      );
      ufo.rotation.y += headingDelta * (1 - Math.exp(-3 * delta));
    }

    const tilt = (state.velocity.y / Math.max(speed, 0.1)) * 0.25;
    ufo.rotation.x += (tilt - ufo.rotation.x) * (1 - Math.exp(-2 * delta));

    state.spin += delta * 0.5;
    state.bobPhase += delta * 1.2;

    ufo.rotation.z = Math.sin(state.spin * 2) * 0.2;

    const bob = Math.sin(state.bobPhase) * 1.2;
    ufo.position.y += (bob - (ufo.userData.bobOffset || 0)) * 0.1;
    ufo.userData.bobOffset = bob;
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
    if (app.audio && typeof app.audio.playShipSound === 'function') {
      if (app._lastShipSoundType !== app.currentShipType) {
        app.audio.playShipSound(app.currentShipType);
        app._lastShipSoundType = app.currentShipType;
      }
    }
  } else {
    if (app.audio && typeof app.audio.playEngine === 'function') {
      app.audio.playEngine(false);
    }
    if (app.audio && typeof app.audio.stopShipSound === 'function') {
      app.audio.stopShipSound();
      app._lastShipSoundType = null;
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
