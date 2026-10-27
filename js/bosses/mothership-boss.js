/**
 * Mother Ship UFO Boss
 * Model: asset3D/monster/mother ship ufo.glb
 * Posisi sangat jauh dari orbit Neptunus (0,0,0)
 * Hanya menjadi agresif saat pemain cukup dekat
 */
app.createMothershipBoss = function () {
  return app.createBoss({
    name: 'Mothership',
    modelPath: 'asset3D/monster/mother ship ufo.glb',
    position: { x: 45000, y: -8000, z: 35000 },
    // Ukuran menengah supaya kapal tetap terlihat utuh tanpa memenuhi kamera.
    scale: 25,
    health: 5000,
    triggerDistance: 4000,
    attackRange: 3000,
    damage: 55,
    projectileSpeed: 200,
    projectileColor: 0x00ffff,
    // Clip "Scene" dari file ini membuat mesh pecah saat diputar oleh Three.js.
    disableModelAnimations: true,
    configureMaterials: true,
    // Panel kapal berlapis; self-shadow menimbulkan garis/bercak.
    disableShadows: true,
    // Gerakkan parent secara lembut tanpa mengubah geometri GLB.
    proceduralMotion: {
      bobHeight: 18,
      bobSpeed: 0.65,
      turnSpeed: 0.16,
      swayAngle: 0.035,
      swaySpeed: 0.48,
    },
    animationName: null,
    lodDetail: 120,
    lodColor: 0x00ffff,
    lodDistance: 120000,
  });
};
