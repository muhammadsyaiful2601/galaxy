/**
 * Boss System - Base shared untuk semua bos
 * Setiap bos memiliki file codingan sendiri di folder js/bosses/
 * Bos akan menjadi agresif hanya ketika pemain berada di dekat (trigger distance)
 */

app.bosses = [];
app.bossMeshes = {};

// Inisialisasi data combat untuk bos
if (!app.combat.bosses) app.combat.bosses = {};

// Siapkan semua clip GLB sekali saja. Nama clip tiap aset berbeda, jadi state
// gameplay dipetakan ke kata kunci umum, bukan ke nama yang di-hardcode.
app.setupBossAnimations = function (boss, model, clips, preferredName) {
  if (!clips || clips.length === 0) return;

  const findClip = (pattern) => clips.find((clip) => pattern.test(clip.name));
  const selected =
    (preferredName && THREE.AnimationClip.findByName(clips, preferredName)) ||
    findClip(/idle|bored|scene|take/i) ||
    clips[0];
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  const addAction = (state, clip) => {
    if (!clip || actions[state]) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    actions[state] = action;
  };

  addAction('idle', selected);
  addAction('walk', findClip(/walk|move|run|fly/i));
  addAction('attack', findClip(/attack|flail|charged|shoot/i));

  boss.userData.mixer = mixer;
  boss.userData.animationActions = actions;
  boss.userData.animationName = selected.name;
  boss.userData.animationState = null;
  app.setBossAnimation(boss, 'idle', true);
};

app.setBossAnimation = function (boss, state, immediate) {
  const ud = boss.userData;
  const actions = ud.animationActions;
  if (!actions) return;
  const resolvedState = actions[state] ? state : 'idle';
  const next = actions[resolvedState];
  if (!next || (!immediate && ud.animationAction === next)) return;
  const previous = ud.animationAction;
  if (previous && previous !== next) previous.fadeOut(0.2);
  next.reset().setEffectiveWeight(1).fadeIn(immediate ? 0 : 0.2).play();
  ud.animationAction = next;
  ud.animationState = resolvedState;
};

// Dipakai untuk aset tanpa clip yang aman. Gerak berada di grup/model induk,
// sehingga tidak pernah mengubah tulang atau vertex animation dari GLB.
app.updateBossProceduralMotion = function (boss, delta) {
  const ud = boss.userData;
  const motion = ud.proceduralMotion;
  if (!motion) return;
  ud.motionTime = (ud.motionTime || 0) + delta;
  const t = ud.motionTime;
  boss.position.y = ud.homePosition.y + Math.sin(t * motion.bobSpeed) * motion.bobHeight;
  boss.rotation.y += motion.turnSpeed * delta;
  if (ud.model) {
    ud.model.rotation.z = Math.sin(t * motion.swaySpeed) * motion.swayAngle;
    ud.model.rotation.x = Math.cos(t * motion.swaySpeed * 0.73) * motion.swayAngle * 0.35;
  }
};

app.configureBossMaterials = function (model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (!material) return;
      // Pertahankan alpha bawaan GLB, tetapi jangan biarkan panel transparan
      // menulis depth dan memotong permukaan kapal di belakangnya.
      if (material.transparent) {
        material.depthWrite = false;
        child.renderOrder = 1;
      }
      material.depthTest = true;
      material.needsUpdate = true;
    });
  });
};

/**
 * Membuat bos dengan model GLB, animasi, health, dan AI dasar.
 * @param {Object} config
 *   {String} name           - Nama unik bos
 *   {String} modelPath      - Path file GLB
 *   {Object} position       - {x, y, z} posisi awal (sangat jauh dari 0,0,0)
 *   {Number} scale          - Skala model (bos sangat besar)
 *   {Number} health         - HP bos (sangat sulit dikalahkan)
 *   {Number} triggerDistance - Jarak deteksi pemain untuk menjadi hostile
 *   {Number} attackRange    - Jarak maksimum menyerang pemain
 *   {Number} damage         - Damage per peluru bos ke pemain
 *   {Number} projectileSpeed- Kecepatan peluru bos
 *   {Number} projectileColor- Warna peluru bos (hex)
 *   {String} animationName  - Nama animasi yang akan diputar (null = yang pertama)
 *   {Boolean} disableModelAnimations - Jangan putar clip GLB bila clip aset rusak
 *   {Number} lodDistance    - Jarak detail LOD
 *   {Number} lodColor       - Warna sprite LOD
 */
app.createBoss = function (config) {
  const bossGroup = new THREE.Group();
  bossGroup.name = config.name;
  bossGroup.position.set(config.position.x, config.position.y, config.position.z);
  bossGroup.userData = {
    bossName: config.name,
    homePosition: new THREE.Vector3(config.position.x, config.position.y, config.position.z),
    health: config.health,
    maxHealth: config.health,
    hostile: false,
    triggerDistance: config.triggerDistance || 1500,
    attackRange: config.attackRange || 1200,
    shotCooldown: 0,
    respawnTimer: 0,
    scale: config.scale || 50,
    damage: config.damage || 40,
    projectileSpeed: config.projectileSpeed || 160,
    projectileColor: config.projectileColor || 0xff0040,
    mixer: null,
    animationAction: null,
    model: null,
    idleTimer: 0,
    idleFloatHeight: 0,
    proceduralMotion: config.proceduralMotion || null,
    motionTime: 0,
  };

  app.scene.add(bossGroup);
  app.bosses.push(bossGroup);
  app.bossMeshes[config.name] = bossGroup;

  app.combat.bosses[config.name] = {
    health: config.health,
    maxHealth: config.health,
    hostile: false,
    respawnTimer: 0,
  };

  const loader = new THREE.GLTFLoader();
  loader.load(
    config.modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if (config.hideNodes && config.hideNodes.includes(child.name)) {
          child.visible = false;
        }
        if (child.isMesh) {
          child.castShadow = !config.disableShadows;
          child.receiveShadow = !config.disableShadows;
        }
      });

      if (config.configureMaterials) app.configureBossMaterials(model);

      model.scale.setScalar(config.scale || 50);

      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.copy(center).negate();

      bossGroup.add(model);
      bossGroup.userData.model = model;

      // Beberapa aset ekspor (Mothership) mempunyai track transform yang merusak
      // mesh ketika diputar. Boss tersebut tetap dianimasikan secara prosedural.
      if (!config.disableModelAnimations) {
        app.setupBossAnimations(bossGroup, model, gltf.animations, config.animationName);
      }

      app.addDistanceLOD(
        bossGroup,
        config.lodDetail || 120,
        config.lodColor || 0xff0040,
        config.lodDistance || 2500
      );
    },
    undefined,
    (err) => {
      console.error('Gagal memuat model bos ' + config.name + ':', err);
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(12, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xff0040, emissive: 0x550000 })
      );
      bossGroup.add(fallback);
      bossGroup.userData.model = fallback;
      app.addDistanceLOD(
        bossGroup,
        config.lodDetail || 120,
        config.lodColor || 0xff0040,
        config.lodDistance || 2500
      );
    }
  );

  return bossGroup;
};

/**
 * Memunculkan peluru dari bos ke arah target.
 */
app.fireBossProjectile = function (boss, targetPos, ud) {
  const start = boss.position.clone();
  const direction = targetPos.clone().sub(start).normalize();
  const projectile = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 14, 10),
    new THREE.MeshBasicMaterial({
      color: ud.projectileColor,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    })
  );
  projectile.position.copy(start);
  app.scene.add(projectile);
  combat.projectiles.push({
    object: projectile,
    direction,
    speed: ud.projectileSpeed,
    life: 18,
    owner: 'boss-' + ud.bossName,
    damage: ud.damage,
    color: ud.projectileColor,
  });
};

/**
 * Pemain menembak bos: kurangi health bos, aktifkan hostility.
 */
app.hitBoss = function (bossName, damage) {
  const bc = app.combat.bosses[bossName];
  if (!bc || bc.respawnTimer > 0) return;

  bc.hostile = true;
  const boss = app.bossMeshes[bossName];
  const ud = boss ? boss.userData : null;

  bc.health = Math.max(0, bc.health - damage);

  if (bc.health === 0) {
    app.createCombatExplosion(boss.position, 0xff0000);
    boss.visible = false;
    bc.respawnTimer = 5.0;
    bc.hostile = false;
    ud.hostile = false;
    app.showToast('BOS ' + bossName + ' TERHANCUR — RESPAWN 5 DETIK');
  }
};

/**
 * Update HUD health bar untuk semua bos.
 */
app.updateBossHUD = function () {
  const combat = app.combat;
  for (const bossName of Object.keys(combat.bosses)) {
    const bc = combat.bosses[bossName];
    const fillEl = document.getElementById('boss-health-fill-' + bossName);
    const labelEl = document.getElementById('boss-health-label-' + bossName);
    if (!fillEl || !labelEl) continue;

    if (bc.respawnTimer > 0) {
      fillEl.style.width = '0%';
      labelEl.innerText = 'RESPAWNING...';
    } else {
      fillEl.style.width =
        (bc.health / bc.maxHealth) * 100 + '%';
      labelEl.innerText = bc.hostile
        ? Math.ceil(bc.health) + ' / ' + bc.maxHealth
        : 'NEUTRAL';
    }
  }
};

/**
 * Update semua bos: cek jarak ke pemain, aktifkan hostility, gerakkan, tiriskan,
 * update animasi, dan tangani peluru bos.
 */
app.updateBosses = function (delta) {
  const combat = app.combat;
  const playerPos = app.camera.position;

  for (let i = app.bosses.length - 1; i >= 0; i--) {
    const boss = app.bosses[i];
    const ud = boss.userData;
    const bc = combat.bosses[ud.bossName];
    if (!bc) continue;

    // Respawn timer
    if (bc.respawnTimer > 0) {
      bc.respawnTimer -= delta;
      if (bc.respawnTimer <= 0) {
        bc.respawnTimer = 0;
        bc.health = bc.maxHealth;
        bc.hostile = false;
        ud.hostile = false;
        ud.shotCooldown = 0;
        boss.visible = true;
        boss.position.copy(ud.homePosition);
        app.showToast('BOS ' + ud.bossName + ' RESPAWNING');
      }
      continue;
    }

    // Update animasi mixer
    if (ud.mixer) ud.mixer.update(delta);

    // Animasi idle saat tidak hostile
    if (!bc.hostile) {
      ud.idleTimer += delta;

      // Jika ada animasi GLTF (mixer), biarkan GLTF mengatur rotasi;
      // hanya terapkan float naik-turun halus di atas posisi awal
      if (ud.mixer) {
        ud.idleFloatHeight = Math.sin(ud.idleTimer * 1.5) * 6;
        boss.position.y = ud.homePosition.y + ud.idleFloatHeight;
      } else {
        // Fallback untuk model tanpa animasi GLTF: float + rotate prosedural
        if (ud.proceduralMotion) {
          app.updateBossProceduralMotion(boss, delta);
        } else {
          ud.idleFloatHeight = Math.sin(ud.idleTimer * 1.5) * 8;
          boss.position.y = ud.homePosition.y + ud.idleFloatHeight;
          boss.rotation.y += 0.05 * delta;
        }
      }
      app.setBossAnimation(boss, 'idle');
    }

    const bossPos = boss.position;
    const dist = playerPos.distanceTo(bossPos);

    // Proximity trigger: bos menjadi hostile jika pemain cukup dekat
    if (!bc.hostile && dist <= ud.triggerDistance) {
      bc.hostile = true;
      ud.hostile = true;
      app.showToast('PERINGATAN: ' + ud.bossName + ' TERDETEKSI — HOSTILE');
    }

    if (bc.hostile) {
      // Gerak menuju pemain (chase)
      const toPlayer = new THREE.Vector3().subVectors(playerPos, bossPos);
      const distSq = toPlayer.lengthSq();
      if (distSq > 0.001) {
        const moveDir = toPlayer.normalize();
        const chaseSpeed = ud.projectileSpeed * 0.25;
        boss.position.addScaledVector(moveDir, chaseSpeed * delta);

        const targetRotation = Math.atan2(moveDir.x, moveDir.z);
        const rotationDelta = Math.atan2(
          Math.sin(targetRotation - boss.rotation.y),
          Math.cos(targetRotation - boss.rotation.y)
        );
        boss.rotation.y += rotationDelta * (1 - Math.exp(-3 * delta));
      }

      if (ud.attackUntil && ud.attackUntil > 0) {
        ud.attackUntil = Math.max(0, ud.attackUntil - delta);
      } else {
        app.setBossAnimation(boss, 'walk');
      }

      // Tembak ke pemain jika dalam attack range
      if (ud.shotCooldown <= 0 && dist <= ud.attackRange) {
        app.fireBossProjectile(boss, playerPos, ud);
        ud.shotCooldown = 2.2;
        ud.attackUntil = 0.7;
        app.setBossAnimation(boss, 'attack');
      }
      if (ud.shotCooldown > 0) ud.shotCooldown -= delta;
    }
  }

  // Update peluru milik bos
  for (let i = combat.projectiles.length - 1; i >= 0; i--) {
    const p = combat.projectiles[i];
    if (p.owner && p.owner.startsWith('boss-')) {
      p.life -= delta;
      p.object.position.addScaledVector(p.direction, p.speed * delta);

      const hitPlayer =
        combat.playerRespawnTimer <= 0 &&
        p.object.position.distanceTo(app.camera.position) < 16;
      if (hitPlayer) {
        combat.playerHealth = Math.max(0, combat.playerHealth - p.damage);
        app.createCombatExplosion(p.object.position, p.color);
        if (combat.playerHealth === 0) {
          app.createCombatExplosion(app.camera.position, 0xf97316);
          combat.playerRespawnTimer = 3;
          app.showToast('KAPAL DESTRUKSI — EMERGENCY RESPAWN');
        }
        p.life = 0;
      }

      if (p.life <= 0) {
        app.scene.remove(p.object);
        p.object.geometry.dispose();
        p.object.material.dispose();
        combat.projectiles.splice(i, 1);
      }
    }
  }
};
