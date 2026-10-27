/**
 * Argus Monster Boss
 * Model: asset3D/monster/aomretold_-_argus_monster_with_animations.glb
 * Posisi sangat jauh dari orbit Neptunus (0,0,0)
 * Hanya menjadi agresif saat pemain cukup dekat
 */
app.createArgusBoss = function () {
  return app.createBoss({
    name: 'Argus',
    modelPath: 'asset3D/monster/aomretold_-_argus_monster_with_animations.glb',
    position: { x: 2500000, y: 400000, z: -1800000 },
    scale: 60,
    health: 3000,
    triggerDistance: 2000,
    attackRange: 1500,
    damage: 45,
    projectileSpeed: 180,
    projectileColor: 0xff0040,
    animationName: null,
    lodDetail: 150,
    lodColor: 0xff0040,
    lodDistance: 3000,
  });
};