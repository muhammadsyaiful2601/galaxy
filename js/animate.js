const cockpitViewTransforms = {
  recon: { scale: 2, rotationY: Math.PI, position: [0, 0,0] },
  heavy: { scale: 2, rotationY: Math.PI, position: [0, 0, 0] },
  ufo: { scale: 2, rotationY: Math.PI, position: [0, 0, 0] },
};
const wibTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
const wibDateFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

app.animate = function () {
  requestAnimationFrame(app.animate);
  const delta = app.clock.getDelta();
  const elapsedTime = app.clock.elapsedTime;
  const realTimeMilliseconds = typeof performance.timeOrigin === 'number'
    ? performance.timeOrigin + performance.now()
    : Date.now();
  const julianDate = realTimeMilliseconds / 86400000 + 2440587.5;
  const daysSinceJ2000 = julianDate - 2451545;
  const currentSecond = Math.floor(realTimeMilliseconds / 1000);

  if (app.lastClockSecond !== currentSecond) {
    const now = new Date(realTimeMilliseconds);
    const clockTime = document.getElementById('hud-clock-time');
    const clockDate = document.getElementById('hud-clock-date');
    if (clockTime && clockDate) {
      clockTime.innerText = wibTimeFormatter.format(now) + ' WIB';
      clockDate.innerText = wibDateFormatter.format(now);
    }
    app.lastClockSecond = currentSecond;
  }

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
    app.getKeplerPosition(o.elements, o.radius, julianDate, o.group.position);
    if (o.elements.rotationPeriodDays && o.mesh) {
      const rotation = THREE.MathUtils.euclideanModulo(
        (daysSinceJ2000 / o.elements.rotationPeriodDays) * Math.PI * 2,
        Math.PI * 2
      );
      const axialTilt = THREE.MathUtils.degToRad(o.elements.axialTilt || 0);
      o.mesh.rotation.y = o.initialRotation.y + rotation;
      o.group.rotation.z = axialTilt;
      if (o.group.userData && o.group.userData.cloudMesh) {
        o.group.userData.cloudMesh.rotation.y = rotation;
      }
    }
    if (o.group.userData && o.group.userData.cloudMesh) {
      o.group.userData.cloudMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.03;
    }
  });

  app.moons.forEach((moon) => {
    const angle = THREE.MathUtils.euclideanModulo(
      (daysSinceJ2000 / moon.periodDays) * Math.PI * 2,
      Math.PI * 2
    );
    moon.group.position.set(
      Math.cos(angle) * moon.radius,
      0,
      Math.sin(angle) * moon.radius
    );
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
    });
  }
  if (app.sunMesh) {
    app.sunMesh.rotation.y = THREE.MathUtils.euclideanModulo(
      (daysSinceJ2000 / 25.05) * Math.PI * 2,
      Math.PI * 2
    );
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

    state.desiredVelocity.copy(state.wanderDirection);
    if (app.combat.hostile && app.combat.ufoRespawnTimer <= 0) {
      state.toPlayer.subVectors(app.camera.position, ufo.position);
      if (state.toPlayer.lengthSq() > 0.001) {
        state.desiredVelocity.lerp(state.toPlayer.normalize(), 0.72).normalize();
      }
    }
    state.desiredVelocity.multiplyScalar(state.speed * (app.combat.hostile ? 1.25 : 1));
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

  if (moveVec.lengthSq() > 0 && (!app.combat || app.combat.playerRespawnTimer <= 0)) {
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
      app.audio.playShipSound(app.currentShipType, 'moving');
    }
  } else {
    if (app.audio && typeof app.audio.playEngine === 'function') {
      app.audio.playEngine(false);
    }
    if (app.audio && typeof app.audio.playShipSound === 'function') {
      app.audio.playShipSound(app.currentShipType, 'idle');
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
    const distanceAU = dist / WORLD_UNITS_PER_AU;
    document.getElementById('hud-distance').innerText = distanceAU < 0.1
      ? Math.round(dist * KM_PER_WORLD_UNIT).toLocaleString('id-ID') + ' km'
      : distanceAU.toFixed(1) + ' AU';
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
    if (node === app.autonomousUFO && app.combat.ufoRespawnTimer > 0) {
      node.visible = false;
      return;
    }
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

  app.updateCombat(delta);
  app.updateBosses(delta);
  app.updateBossHUD();
  app.renderer.render(app.scene, app.camera);
};

app.createCombatExplosion = function (position, color) {
  const group = new THREE.Group();
  group.position.copy(position);

  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(flash);

  const particleCount = 36;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const direction = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    ).normalize();
    velocities[i * 3] = direction.x * (30 + Math.random() * 70);
    velocities[i * 3 + 1] = direction.y * (30 + Math.random() * 70);
    velocities[i * 3 + 2] = direction.z * (30 + Math.random() * 70);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
      color,
      size: 3,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(particles);
  app.scene.add(group);
  app.combat.effects.push({ object: group, flash, particles, velocities, life: 0.8, duration: 0.8 });
};

app.firePlayerLaser = function () {
  const combat = app.combat;
  if (
    combat.playerRespawnTimer > 0
    || combat.ufoRespawnTimer > 0
    || app.isWarping
    || app.isAligning
    || app.isCountdown
  ) return;

  combat.playerShotCooldown = 0.24;
  if (app.audio && typeof app.audio.playShootSound === 'function') {
    app.audio.playShootSound();
  }
  app.camera.updateMatrixWorld();
  const direction = app.camera.getWorldDirection(new THREE.Vector3());
  const cameraOrigin = app.camera.getWorldPosition(new THREE.Vector3());
  let origin = cameraOrigin.clone();

  if (app.currentViewMode === '3rd' && app.activeShipGroup && app.activeShipGroup.visible) {
    app.activeShipGroup.updateMatrixWorld(true);
    const shipBounds = new THREE.Box3().setFromObject(app.activeShipGroup);
    if (!shipBounds.isEmpty()) {
      const shipCenter = shipBounds.getCenter(new THREE.Vector3());
      const halfSize = shipBounds.getSize(new THREE.Vector3()).multiplyScalar(0.5);
      const noseOffset = Math.abs(direction.x) * halfSize.x
        + Math.abs(direction.y) * halfSize.y
        + Math.abs(direction.z) * halfSize.z;
      origin = shipCenter.addScaledVector(direction, noseOffset);
    }
  } else {
    origin.addScaledVector(direction, 5);
  }

  const aimPoint = cameraOrigin.addScaledVector(direction, 2500);
  const shotDirection = aimPoint.sub(origin).normalize();
  const targetOffset = app.autonomousUFO
    ? app.autonomousUFO.getWorldPosition(new THREE.Vector3()).sub(origin)
    : new THREE.Vector3();
  const targetDepth = targetOffset.dot(shotDirection);
  const targetMiss = targetOffset.addScaledVector(shotDirection, -targetDepth).length();
  const hit = app.autonomousUFO
    && app.autonomousUFO.visible
    && targetDepth > 0
    && targetDepth < 2500
    && targetMiss < 10;
  const end = hit
    ? origin.clone().addScaledVector(shotDirection, targetDepth)
    : origin.clone().addScaledVector(shotDirection, 500);
  const beam = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([origin, end]),
    new THREE.LineBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  app.scene.add(beam);
  combat.effects.push({ object: beam, life: 0.12, duration: 0.12 });

  if (hit) {
    combat.hostile = true;
    combat.ufoHealth = Math.max(0, combat.ufoHealth - 34);
    if (combat.ufoHealth === 0) {
      app.createCombatExplosion(app.autonomousUFO.position, 0x67e8f9);
      app.autonomousUFO.visible = false;
      combat.hostile = false;
      combat.ufoRespawnTimer = 2.2;
      for (let i = combat.projectiles.length - 1; i >= 0; i--) {
        const projectile = combat.projectiles[i];
        if (projectile.owner !== 'ufo') continue;
        app.scene.remove(projectile.object);
        projectile.object.geometry.dispose();
        projectile.object.material.dispose();
        combat.projectiles.splice(i, 1);
      }
      app.showToast('UFO DESTROYED — TARGET RESPAWNING');
    } else {
      app.showToast('UFO HIT — IT IS HOSTILE');
    }
  }

  // Cek apakah peluru mengenai bos
  for (let i = app.bosses.length - 1; i >= 0; i--) {
    const boss = app.bosses[i];
    const ud = boss.userData;
    if (!boss.visible) continue;
    const bossPos = boss.getWorldPosition(new THREE.Vector3());
    const bossOffset = bossPos.sub(origin);
    const bossDepth = bossOffset.dot(shotDirection);
    const bossMiss = bossOffset.addScaledVector(shotDirection, -bossDepth).length();
    const bossHit = bossDepth > 0 && bossDepth < 2500 && bossMiss < 25;
    if (bossHit) {
      combat.hostile = true;
      app.hitBoss(ud.bossName, 120);
      app.createCombatExplosion(bossPos, 0xff0040);
      app.showToast('BOS ' + ud.bossName + ' DIHANTAR!');
      break;
    }
  }
};

app.fireUFOProjectile = function () {
  const start = app.autonomousUFO.position.clone();
  const target = app.camera.getWorldPosition(new THREE.Vector3());
  const direction = target.sub(start).normalize();
  const projectile = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 10, 8),
    new THREE.MeshBasicMaterial({
      color: 0xfb7185,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    })
  );
  projectile.position.copy(start);
  app.scene.add(projectile);
  app.combat.projectiles.push({
    object: projectile,
    direction,
    speed: 190,
    life: 12,
    owner: 'ufo',
  });
};

app.updateCombat = function (delta) {
  const combat = app.combat;
  combat.playerShotCooldown = Math.max(0, combat.playerShotCooldown - delta);
  combat.enemyShotCooldown = Math.max(0, combat.enemyShotCooldown - delta);

  if (combat.playerRespawnTimer > 0) {
    combat.playerRespawnTimer -= delta;
    if (combat.playerRespawnTimer <= 0) {
      combat.playerHealth = combat.playerMaxHealth;
      combat.playerRespawnTimer = 0;
      app.camera.position.copy(app.playerSpawnPosition);
      app.controls.target.copy(app.playerSpawnTarget);
      app.camera.lookAt(app.playerSpawnTarget);
      app.followTarget = null;
      app.showToast('SHIP REPAIRED — RESPAWNED AT SECTOR 07-X');
    }
  }

  if (combat.ufoRespawnTimer > 0) {
    combat.ufoRespawnTimer -= delta;
    if (combat.ufoRespawnTimer <= 0) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 160 + Math.random() * 340;
      app.autonomousUFO.position.set(
        app.ufoState.homePosition.x + Math.cos(angle) * radius,
        app.ufoState.homePosition.y + (Math.random() - 0.5) * 180,
        app.ufoState.homePosition.z + Math.sin(angle) * radius
      );
      app.ufoState.homePosition.copy(app.autonomousUFO.position);
      app.ufoState.velocity.set(12, 0, 6);
      app.ufoState.wanderTimer = 0;
      app.autonomousUFO.visible = true;
      combat.ufoHealth = combat.ufoMaxHealth;
      combat.ufoRespawnTimer = 0;
      app.showToast('NEW UFO CONTACT — NEUTRAL');
    }
  }

  if (app.keys['Space'] && combat.playerShotCooldown <= 0) {
    app.firePlayerLaser();
  }

  if (combat.hostile && combat.ufoRespawnTimer <= 0 && combat.playerRespawnTimer <= 0) {
    if (combat.enemyShotCooldown <= 0) {
      app.fireUFOProjectile();
      combat.enemyShotCooldown = 1.35;
    }
  }

  for (let i = combat.projectiles.length - 1; i >= 0; i--) {
    const projectile = combat.projectiles[i];
    projectile.life -= delta;
    projectile.object.position.addScaledVector(projectile.direction, projectile.speed * delta);

    const hitPlayer = projectile.owner === 'ufo'
      && combat.playerRespawnTimer <= 0
      && projectile.object.position.distanceTo(app.camera.position) < 12;
    if (hitPlayer) {
      combat.playerHealth = Math.max(0, combat.playerHealth - 20);
      app.createCombatExplosion(projectile.object.position, 0xfb7185);
      if (combat.playerHealth === 0) {
        app.createCombatExplosion(app.camera.position, 0xf97316);
        combat.playerRespawnTimer = 2;
        app.showToast('SHIP DESTROYED — EMERGENCY RESPAWN');
      }
      projectile.life = 0;
    }

    if (projectile.life <= 0) {
      app.scene.remove(projectile.object);
      projectile.object.geometry.dispose();
      projectile.object.material.dispose();
      combat.projectiles.splice(i, 1);
    }
  }

  for (let i = combat.effects.length - 1; i >= 0; i--) {
    const effect = combat.effects[i];
    effect.life -= delta;
    const progress = 1 - Math.max(0, effect.life) / effect.duration;
    if (effect.flash) {
      effect.flash.scale.setScalar(2 + progress * 22);
      effect.flash.material.opacity = 0.9 * (1 - progress);
      const positions = effect.particles.geometry.attributes.position.array;
      for (let p = 0; p < effect.velocities.length / 3; p++) {
        positions[p * 3] += effect.velocities[p * 3] * delta;
        positions[p * 3 + 1] += effect.velocities[p * 3 + 1] * delta;
        positions[p * 3 + 2] += effect.velocities[p * 3 + 2] * delta;
      }
      effect.particles.geometry.attributes.position.needsUpdate = true;
      effect.particles.material.opacity = 1 - progress;
    } else {
      effect.object.material.opacity = 1 - progress;
    }
    if (effect.life <= 0) {
      app.scene.remove(effect.object);
      effect.object.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) object.material.dispose();
      });
      combat.effects.splice(i, 1);
    }
  }

  const playerHealthFill = document.getElementById('player-health-fill');
  const playerHealthLabel = document.getElementById('player-health-label');
  const ufoHealthFill = document.getElementById('ufo-health-fill');
  const ufoHealthLabel = document.getElementById('ufo-health-label');
  const combatStatus = document.getElementById('combat-status');
  if (playerHealthFill) playerHealthFill.style.width = (combat.playerHealth / combat.playerMaxHealth * 100) + '%';
  if (playerHealthLabel) playerHealthLabel.innerText = combat.playerRespawnTimer > 0
    ? 'RESPAWNING...'
    : Math.ceil(combat.playerHealth) + ' / ' + combat.playerMaxHealth;
  if (ufoHealthFill) ufoHealthFill.style.width = (combat.ufoHealth / combat.ufoMaxHealth * 100) + '%';
  if (ufoHealthLabel) ufoHealthLabel.innerText = combat.ufoRespawnTimer > 0
    ? 'RESPAWNING...'
    : combat.hostile
      ? Math.ceil(combat.ufoHealth) + ' / ' + combat.ufoMaxHealth
      : 'NEUTRAL';
  if (combatStatus) combatStatus.innerText = combat.hostile ? 'HOSTILE CONTACT' : 'SPACE: FIRE LASER';
};
