/**
 * Tank Alien Boss
 * Model: asset3D/monster/tank alien.glb
 * Posisi sangat jauh dari orbit Neptunus (0,0,0)
 * Hanya menjadi agresif saat pemain cukup dekat
 */
app.createTankAlienBoss = function () {
  return app.createBoss({
    name: 'TankAlien',
    modelPath: 'asset3D/monster/tank alien.glb',
    position: { x: 1800000, y: 1000000, z: -2900000 },
    scale: 50,
    health: 4000,
    triggerDistance: 1800,
    attackRange: 1400,
    damage: 40,
    projectileSpeed: 170,
    projectileColor: 0xffaa00,
    // Plane transparan bawaan GLB berskala besar tampak sebagai bayangan hitam.
    hideNodes: ['pPlane1'],
    animationName: null,
    lodDetail: 140,
    lodColor: 0xffaa00,
    lodDistance: 2800,
  });
};
