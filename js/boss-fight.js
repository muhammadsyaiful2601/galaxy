// Boss Fight specific logic - handles boss combat behavior when loaded in boss-fight.html
window.bossFight = {
  playerHealth: 100,
  playerMaxHealth: 100,
  lastShotTime: 0,
  boss: null,
  bossName: null,
  motionTime: 0,

  enablePointerLock: function () {
    const canvas = document.querySelector('#canvas-container canvas');
    if (!canvas) return;

    canvas.addEventListener('click', () => {
      if (document.pointerLockElement === canvas) return;
      const request = canvas.requestPointerLock();
      if (request && typeof request.catch === 'function') {
        request.catch(() => app.showToast('KLIK AREA PERMAINAN UNTUK MENGUNCI KURSOR'));
      }
    });

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement === canvas;
      document.body.classList.toggle('boss-look-locked', locked);
      app.bossLookLocked = locked;
      if (locked) {
        this.previousDamping = app.controls.enableDamping;
        this.previousControlsEnabled = app.controls.enabled;
        this.lookEuler = new THREE.Euler().setFromQuaternion(app.camera.quaternion, 'YXZ');
      }
      app.controls.enableDamping = locked ? false : this.previousDamping;
      app.controls.enabled = locked ? false : this.previousControlsEnabled;
    });

    document.addEventListener('mousemove', (event) => {
      if (document.pointerLockElement !== canvas) return;
      const sensitivity = 0.0022;
      this.lookEuler.y -= event.movementX * sensitivity;
      this.lookEuler.x = THREE.MathUtils.clamp(
        this.lookEuler.x - event.movementY * sensitivity,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05
      );
      app.camera.quaternion.setFromEuler(this.lookEuler);
      app.camera.getWorldDirection(app._lookDirection);
      app.controls.target.copy(app.camera.position).addScaledVector(app._lookDirection, 100);
      app.controls.update();
    });

    document.addEventListener('pointerlockerror', () => {
      app.showToast('KURSOR TIDAK DAPAT DIKUNCI DI BROWSER INI');
    });
  },

  init: function () {
    const params = new URLSearchParams(window.location.search);
    this.bossName = params.get('boss') || 'Argus';

    // Find the spawned boss
    if (app.bosses && app.bosses.length > 0) {
      this.boss = app.bosses.find(b => b.userData.bossName === this.bossName);
      if (!this.boss) this.boss = app.bosses[0];
    }

    // Update HUD
    const nameEl = document.getElementById('boss-name-label');
    if (nameEl) nameEl.innerText = this.bossName;

    // Start player shooting loop
    this.lastShotTime = performance.now();
  },

  update: function (delta) {
    if (!this.boss || !app.camera) return;

    const bossPos = this.boss.position;
    const playerPos = app.camera.position;
    const dist = bossPos.distanceTo(playerPos);

    // Halaman boss menimpa updateBosses utama, jadi mixer harus diperbarui di sini.
    const ud = this.boss.userData;
    if (ud.mixer) ud.mixer.update(delta);
    this.motionTime += delta;
    if (ud.proceduralMotion) {
      app.updateBossProceduralMotion(this.boss, delta);
    } else {
      bossPos.y = ud.homePosition.y + Math.sin(this.motionTime * 1.4) * 8;
      this.boss.rotation.y += delta * 0.12;
    }

    // Boss attacks player if in range
    const now = performance.now();
    if (dist <= (this.boss.userData.attackRange || 1200) && now - this.lastShotTime > 1500) {
      this.bossAttackPlayer();
      this.lastShotTime = now;
    }

    // Boss moves slightly toward player for dynamic feel
    if (dist > 500 && dist < this.boss.userData.triggerDistance) {
      const dir = new THREE.Vector3().subVectors(playerPos, bossPos).normalize();
      bossPos.add(dir.multiplyScalar(0.5 * delta * 60));
      if (!ud.attackUntil) app.setBossAnimation(this.boss, 'walk');
    } else if (!ud.attackUntil) {
      app.setBossAnimation(this.boss, 'idle');
    }

    if (ud.attackUntil) ud.attackUntil = Math.max(0, ud.attackUntil - delta);

    // Update HUD health bars
    this.updateHUD();
  },

  bossAttackPlayer: function () {
    const bossPos = this.boss.position;
    const playerPos = app.camera.position;

    // Create projectile from boss to player
    const projectileGeo = new THREE.SphereGeometry(3, 8, 8);
    const projectileMat = new THREE.MeshBasicMaterial({ color: this.boss.userData.projectileColor || 0xff0040 });
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    projectile.position.copy(bossPos);

    const dir = new THREE.Vector3().subVectors(playerPos, bossPos).normalize();
    app.scene.add(projectile);
    app.combat.projectiles.push({
      object: projectile,
      direction: dir,
      speed: this.boss.userData.projectileSpeed || 160,
      life: 8,
      owner: 'boss',
      damage: this.boss.userData.damage || 40,
    });
    this.boss.userData.attackUntil = 0.7;
    app.setBossAnimation(this.boss, 'attack');
  },

  playerHit: function (damage) {
    app.combat.playerHealth = Math.max(0, app.combat.playerHealth - damage);
    this.updateHUD();

    if (app.combat.playerHealth <= 0) {
      app.combat.playerRespawnTimer = 2;
      app.showToast('SHIP DESTROYED — EMERGENCY RESPAWN');
      setTimeout(() => exitBossFight(), 2000);
    }
  },

  updateHUD: function () {
    const pct = (app.combat.playerHealth / app.combat.playerMaxHealth * 100);
    const fill = document.getElementById('boss-player-health-fill');
    const label = document.getElementById('boss-player-health-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.innerText = Math.ceil(app.combat.playerHealth) + ' / ' + app.combat.playerMaxHealth;

    // Boss health
    if (this.boss) {
      const bc = app.combat.bosses[this.boss.userData.bossName];
      const bossHealth = bc ? bc.health : this.boss.userData.health;
      const bossMaxHealth = bc ? bc.maxHealth : this.boss.userData.maxHealth;
      const bossPct = (bossHealth / bossMaxHealth * 100);
      const bfill = document.getElementById('boss-health-fill');
      const blabel = document.getElementById('boss-health-label');
      if (bfill) bfill.style.width = bossPct + '%';
      if (blabel) blabel.innerText = Math.ceil(bossHealth) + ' / ' + bossMaxHealth;
    }
  },
};

// Hook into existing updateCombat to handle boss-specific projectile logic
const originalUpdateCombat = app.updateCombat;
app.updateCombat = function (delta) {
  originalUpdateCombat.call(this, delta);

  if (!window.bossFight || !window.bossFight.boss) return;

  // Boss movement toward player
  window.bossFight.update(delta);

  const boss = window.bossFight.boss;
  const projectiles = app.combat.projectiles;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // Boss projectile hits player
    if (p.owner === 'boss' && p.object && app.combat.playerRespawnTimer <= 0) {
      const dist = p.object.position.distanceTo(app.camera.position);
      if (dist < 12) {
        window.bossFight.playerHit(p.damage || 40);
        app.scene.remove(p.object);
        p.object.geometry.dispose();
        p.object.material.dispose();
        projectiles.splice(i, 1);
        continue;
      }
    }

    // Player projectile hits boss
    if (p.owner === 'player' && boss && boss.userData) {
      const dist = p.object.position.distanceTo(boss.position);
      if (dist < 50) {
        const bc = app.combat.bosses[boss.userData.bossName];
        if (bc) bc.health -= p.damage || 10;
        app.scene.remove(p.object);
        p.object.geometry.dispose();
        p.object.material.dispose();
        projectiles.splice(i, 1);

        if (bc && bc.health <= 0) {
          document.getElementById('boss-combat-status').innerText = 'DEFEATED';
          document.getElementById('boss-combat-status').className = 'font-orbitron text-[9px] font-bold text-green-400';
          setTimeout(() => {
            alert('Boss ' + boss.userData.bossName + ' dikalahkan!');
            exitBossFight();
          }, 1000);
        }
        continue;
      }
    }
  }
};

// Override updateBosses to prevent base boss system from respawning
// or double-moving the boss in boss-fight.html
app.updateBosses = function (delta) {
  // Boss logic handled entirely by window.bossFight.update()
};

// Expose for use in boss-fight.html inline script
window.playerHitByBoss = function (damage) {
  if (window.bossFight) window.bossFight.playerHit(damage);
};
