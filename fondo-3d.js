/* Fondo de la portada (cerebro que poda) para el resto de páginas: misma escena, más ligera,
   con la cámara recorriendo unas paradas según el % de scroll de la página. Lo carga tema-nuevo.js. */
(function () {
  if (!window.THREE) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.getElementById('an-gl'), renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return; }
  var mobile = innerWidth < 700;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
  renderer.setClearColor(0x060b14);
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x060b14, 0.05);
  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 150);
  scene.add(new THREE.AmbientLight(0x1a2633, 0.9));
  var key = new THREE.DirectionalLight(0x8fb3d9, 1.0); key.position.set(-5, 8, 6); scene.add(key);
  var rim = new THREE.PointLight(0xc9973e, 2.2, 18); rim.position.set(4, 3, 4); scene.add(rim);
  var GOLD = new THREE.Color(0xc9973e), DEAD = new THREE.Color(0x3a1d22), DIM = new THREE.Color(0x14202a), WHITE = new THREE.Color(0xffffff);
  var tint = new THREE.Color(0x8fb3d9), tmp = new THREE.Color(), dummy = new THREE.Object3D();
  var sphere = new THREE.IcosahedronGeometry(1, 1);

  var brain = new THREE.Group(); brain.position.set(2.2, 1.7, 0); scene.add(brain);
  var NB = mobile ? 110 : 200, nodes = [], i, j;
  for (i = 0; i < NB; i++) {
    var side = i % 2 ? 1 : -1, u = Math.random() * Math.PI * 2, w = Math.acos(2 * Math.random() - 1), r = Math.cbrt(Math.random()) * .9 + .25;
    nodes.push({ home: new THREE.Vector3(side * .35 + Math.sin(w) * Math.cos(u) * 1.9 * r, Math.cos(w) * 1.5 * r, Math.sin(w) * Math.sin(u) * 2.4 * r),
      pos: new THREE.Vector3(), vel: 0, state: 0, t: Math.random() * 8, life: 3 + Math.random() * 7, gold: Math.random() < .12, s: .05 + Math.random() * .05 });
    nodes[i].pos.copy(nodes[i].home);
  }
  var edges = [];
  for (i = 0; i < NB; i++) {
    var best = [];
    for (j = 0; j < NB; j++) { if (i === j) continue; var d = nodes[i].home.distanceTo(nodes[j].home);
      if (best.length < 3 || d < best[2].d) { best.push({ j: j, d: d }); best.sort(function (a, b) { return a.d - b.d; }); best.length = Math.min(3, best.length); } }
    best.forEach(function (b) { if (i < b.j) edges.push([i, b.j]); });
  }
  var nodeMesh = new THREE.InstancedMesh(sphere, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .3, metalness: .4, emissive: 0x0a1a1f }), NB);
  brain.add(nodeMesh);
  var ePos = new Float32Array(edges.length * 6), eCol = new Float32Array(edges.length * 6), eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  eGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
  brain.add(new THREE.LineSegments(eGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false })));
  var pc = mobile ? 400 : 800, pos = new Float32Array(pc * 3);
  for (var p = 0; p < pc; p++) { pos[p * 3] = (Math.random() - .5) * 70; pos[p * 3 + 1] = (Math.random() - .5) * 40; pos[p * 3 + 2] = (Math.random() - .5) * 70; }
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var dust = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0x6f86a6, size: .05, transparent: true, opacity: .6 })); scene.add(dust);

  // Paradas de cámara a lo largo del scroll (0 → 1)
  var stops = [[0, 1.9, 10.5, 0x8fb3d9], [-2.2, 2.4, 9.8, 0x7fa3c8], [2.4, 2.2, 9.6, 0xc9973e], [0, 3.2, 11, 0x8fb3d9]];
  var camP = new THREE.Vector3(0, 1.9, 10.5), tP = new THREE.Vector3(), look = new THREE.Vector3(1.2, 1.7, 0), tTint = new THREE.Color(), c1 = new THREE.Color(), c2 = new THREE.Color();
  function target() {
    var max = document.documentElement.scrollHeight - innerHeight, s = max > 0 ? scrollY / max : 0, t = s * (stops.length - 1);
    var k = Math.min(stops.length - 2, Math.floor(t)), f = t - k; f = f * f * (3 - 2 * f);
    var a = stops[k], b = stops[k + 1];
    tP.set(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f);
    tTint.copy(c1.set(a[3])).lerp(c2.set(b[3]), f);
  }
  var ndc = new THREE.Vector2(), ndcS = new THREE.Vector2();
  addEventListener('pointermove', function (e) { ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); }, { passive: true });
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  var clock = new THREE.Clock(), last = 0;
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) { clock.getDelta(); return; }
    var dt = reduce ? 0 : Math.min(.05, clock.getDelta()), t = (last += dt);
    target(); camP.lerp(tP, .02); tint.lerp(tTint, .02); ndcS.lerp(ndc, .025);
    camera.position.set(camP.x + ndcS.x * .45, camP.y + ndcS.y * .25, camP.z); camera.lookAt(look);
    key.color.copy(tint);
    brain.rotation.y = t * .02 + ndcS.x * .12; brain.rotation.x = -ndcS.y * .15;
    for (i = 0; i < NB; i++) {
      var n = nodes[i]; n.t += dt;
      if (n.state === 0 && n.t > n.life) { n.t = 0; n.state = n.gold ? 1 : 2; }
      if (n.state === 2) { n.vel += dt * .2; n.pos.y -= n.vel * dt; if (n.t > 3.2) { n.state = 3; n.t = 0; } }
      if (n.state === 3 && n.t > 1.5) { n.state = 0; n.t = 0; n.vel = 0; n.pos.copy(n.home); n.life = 3 + Math.random() * 7; n.gold = Math.random() < .12; }
      if (n.state === 1 && n.t > 6) { n.state = 0; n.t = 0; n.gold = Math.random() < .5; }
      var test = n.state === 0 ? (.5 + .5 * Math.sin(n.t * 1.1 + i)) : 0;
      var sc = n.s * (n.state === 1 ? 1.7 : n.state === 3 ? 0 : 1); if (n.state === 2) sc *= Math.max(0, 1 - n.t / 3.2);
      dummy.position.copy(n.pos); dummy.scale.setScalar(sc); dummy.updateMatrix(); nodeMesh.setMatrixAt(i, dummy.matrix);
      if (n.state === 1) tmp.copy(GOLD); else if (n.state >= 2) tmp.copy(DEAD); else tmp.copy(DIM).lerp(tint, .35 + test * .65);
      nodeMesh.setColorAt(i, tmp);
    }
    nodeMesh.instanceMatrix.needsUpdate = true; nodeMesh.instanceColor.needsUpdate = true;
    for (var e = 0; e < edges.length; e++) {
      var A = nodes[edges[e][0]], B = nodes[edges[e][1]], o = e * 6;
      ePos[o] = A.pos.x; ePos[o + 1] = A.pos.y; ePos[o + 2] = A.pos.z; ePos[o + 3] = B.pos.x; ePos[o + 4] = B.pos.y; ePos[o + 5] = B.pos.z;
      var on = (A.state >= 2 || B.state >= 2) ? 0 : (A.state === 1 && B.state === 1 ? 1 : .35), cc = (A.state === 1 && B.state === 1) ? GOLD : tint;
      eCol[o] = eCol[o + 3] = cc.r * on * .6; eCol[o + 1] = eCol[o + 4] = cc.g * on * .6; eCol[o + 2] = eCol[o + 5] = cc.b * on * .6;
    }
    eGeo.attributes.position.needsUpdate = true; eGeo.attributes.color.needsUpdate = true;
    dust.rotation.y = t * .003; rim.position.set(Math.sin(t * .08) * 6, 3, Math.cos(t * .08) * 5);
    renderer.render(scene, camera);
  }
  frame();
})();
