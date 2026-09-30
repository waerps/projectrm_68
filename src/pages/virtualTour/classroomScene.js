import { rooms as DATA } from './roomData';
// Original room geometry retained from the approved Sornserm tour.
export function mountClassroomScene() {
  const THREE = window.THREE;
  let stopped = false;
  let animationFrame;
  const preview = new URLSearchParams(location.search).has("preview");
  const $ = id => document.getElementById(id),
    mobile = () => innerWidth < 800;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
  } catch (e) {
    $('loading').textContent = 'กรุณาใช้เบราว์เซอร์ที่รองรับ WebGL';
    throw e;
  }
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  $('canvas').appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'ฉากห้องเรียน ใช้ลูกศรหมุนและปุ่มบวกลบซูม');
  function mat(c) {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      roughness: .8
    });
    m.color.convertSRGBToLinear();
    return m;
  }
  const pink = mat('#e8bcae'),
    cream = mat('#eadccb'),
    white = mat('#f4f0e5'),
    oak = mat('#b99161'),
    dark = mat('#44372f'),
    black = mat('#30363b'),
    steel = mat('#919798'),
    navy = mat('#293b6c'),
    mint = mat('#98bc9c'),
    blue = mat('#447e9d');
  let world,
    picks = [],
    walls = [],
    floor = 2,
    current = null;
  function box(w, h, d, x, y, z, m = white, p = world) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    p.add(o);
    return o;
  }
  function cyl(r, h, x, y, z, m, p = world) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    p.add(o);
    return o;
  }
  function group(x, y, z, rot = 0, p = world) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rot;
    p.add(g);
    return g;
  }
  function label(text, w, h, x, y, z, bg = '#f3e8cf', fg = '#354361', p = world) {
    const c = document.createElement('canvas');
    c.width = 768;
    c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 768, 256);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.font = 'bold 78px Tahoma,Arial';
    ctx.fillText(text, 384, 151);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return box(w, h, .023, x, y, z, new THREE.MeshStandardMaterial({
      map: t
    }), p);
  }
  function clear() {
    if (world) {
      scene.remove(world);
      world.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material?.map) {
          o.material.map.dispose();
          o.material.dispose();
        }
      });
    }
    world = new THREE.Group();
    scene.add(world);
    picks = [];
    walls = [];
  }
  function roomShell(w, d, f = 2) {
    box(w + .15, .17, d + .15, 0, -.1, 0, oak);
    const t = mat(f === 3 ? '#c8ac73' : '#dce0d3');
    box(w, .035, d, 0, 0, 0, t);
    const grout = mat('#adaf9f');
    for (let x = -w / 2; x < w / 2; x += .5) box(.01, .004, d, x, .022, 0, grout);
    for (let z = -d / 2; z < d / 2; z += .5) box(w, .004, .01, 0, .022, z, grout);
    const back = box(w, 3.05, .12, 0, 1.5, -d / 2, pink);
    const left = box(.12, 3.05, d, -w / 2, 1.5, 0, cream);
    for (const wall of [back, left]) {
      wall.material = wall.material.clone();
      wall.material.transparent = true;
    }
    walls.push({
      mesh: back,
      axis: 'z',
      limit: -d / 2
    }, {
      mesh: left,
      axis: 'x',
      limit: -w / 2
    });
    box(w, .14, .045, 0, .08, -d / 2 + .08, dark);
    box(.045, .14, d, -w / 2 + .08, .08, 0, dark);
    for (const x of [-w / 2 + .06, w / 2 - .06]) box(.16, 3.08, .19, x, 1.52, -d / 2 + .04, pink);
  }
  function chair(x, z, rot = 0, color = blue, p = world) {
    const g = group(x, 0, z, rot, p);
    box(.43, .06, .43, 0, .43, 0, color, g);
    box(.43, .40, .07, 0, .68, .19, color, g);
    for (let a of [-.17, .17]) for (let b of [-.17, .17]) box(.027, .43, .027, a, .22, b, steel, g);
    return g;
  }
  function desk(x, z, w = .7, p = world) {
    box(w, .045, .48, x, .73, z, white, p);
    for (let a of [-w / 2 + .05, w / 2 - .05]) for (let b of [-.18, .18]) box(.027, .70, .027, x + a, .37, z + b, black, p);
  }
  function door(x, z, name, roomId, color = oak, rot = 0) {
    const g = group(x, 0, z, rot);
    box(1.02, 2.37, .12, 0, 1.2, 0, dark, g);
    box(.9, 2.27, .13, 0, 1.15, .035, black, g);
    const hinge = group(-.44, 0, .10, 0, g);
    box(.88, 2.24, .06, .44, 1.14, 0, color, hinge);
    cyl(.035, .08, .78, 1.05, .08, steel, hinge);
    label(name, .50, .19, .44, 1.5, .04, '#e2e9de', '#385068', hinge);
    g.traverse(o => {
      if (o.isMesh) {
        o.userData.id = roomId;
        picks.push(o);
      }
    });
    return g;
  }
  function shelves(x, z, w = 1.8, h = 1.8, rot = 0) {
    const g = group(x, 0, z, rot);
    box(w, h, .07, 0, h / 2, -.25, dark, g);
    for (let xx of [-w / 2, 0, w / 2]) box(.045, h, .5, xx, h / 2, 0, dark, g);
    for (let y = .08; y < h; y += .42) {
      box(w, .045, .53, 0, y, 0, dark, g);
      for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) {
        let paper = box(w * .33, .027, .32, (j ? 1 : -1) * w * .25, y + .035 + k * .03, .035, white, g);
        paper.rotation.y = k % 2 * .05;
      }
    }
  }
  function equipment(r, w, d) {
    const list = r.facilities.length ? r.facilities : [{
      Facilities_Name: 'กระดาน',
      Quantity: 1
    }, {
      Facilities_Name: 'เครื่องปรับอากาศ',
      Quantity: 1
    }];
    let boards = 0,
      acs = 0;
    for (const f of list) for (let i = 0; i < f.Quantity; i++) {
      const n = f.Facilities_Name;
      if (n === 'กระดาน') {
        const g = boards++ === 0 ? group(-.5, 1.9, -d / 2 + .10) : group(-w / 2 + .10, 1.85, -.6, Math.PI / 2);
        box(2.35, 1.08, .045, 0, 0, 0, steel, g);
        box(2.26, .99, .052, 0, 0, .012, white, g);
        box(2.25, .035, .10, 0, -.54, .06, steel, g);
      }
      if (n === 'ทีวี') {
        const g = group(w / 2 - 1.03, 1.94, -d / 2 + .15);
        box(1.1, .70, .07, 0, 0, 0, black, g);
        box(1, .6, .078, 0, 0, .01, black, g);
      }
      if (n === 'เครื่องปรับอากาศ') {
        const x = acs++ === 0 ? -w / 2 + .12 : w / 2 - .12;
        const g = group(x, 2.64, .20, x < 0 ? Math.PI / 2 : -Math.PI / 2);
        box(1.05, .32, .22, 0, 0, 0, white, g);
        box(.88, .07, .025, 0, -.11, .12, steel, g);
      }
      if (n === 'โปรเจกเตอร์') {
        const g = group(0, 2.62, .1);
        box(.41, .14, .30, 0, 0, 0, white, g);
        box(.045, .32, .045, 0, .21, 0, steel, g);
        box(.10, .07, .04, .11, -.01, -.17, navy, g);
      }
      if (n === 'ลำโพง') {
        box(.25, .39, .23, w / 2 - .30, 2.45, -d / 2 + .30, black);
      }
      if (n === 'พัดลม') {
        const g = group(w / 2 - .35, 0, -.8);
        cyl(.20, .06, 0, .04, 0, black, g);
        cyl(.017, 1.13, 0, .60, 0, steel, g);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.22, .013, 8, 28), steel);
        ring.position.y = 1.25;
        g.add(ring);
        for (let i = 0; i < 3; i++) {
          const blade = box(.075, .30, .02, 0, 1.25, 0, blue, g);
          blade.rotation.z = i * Math.PI / 3;
        }
      }
    }
  }
  function buildClass(r) {
    clear();
    floor = r.floor;
    current = r;
    const roomUrl = new URL(location.href);
    roomUrl.searchParams.set('floor', floor);
    roomUrl.searchParams.set('room', r.id);
    history.replaceState(history.state, '', roomUrl);
    const cols = r.capacity <= 8 ? 2 : r.capacity <= 15 ? 3 : 4,
      rows = Math.ceil(r.capacity / cols),
      w = cols === 4 ? 6.5 : cols === 3 ? 5.7 : 4.8,
      d = Math.max(5.8, 3.1 + rows * .88);
    roomShell(w, d, r.floor);
    equipment(r, w, d);
    const spacing = cols === 4 ? 1.10 : 1.17,
      start = -(cols - 1) * spacing / 2;
    for (let i = 0; i < r.capacity; i++) {
      const col = i % cols,
        row = Math.floor(i / cols);
      let x = start + col * spacing + (col >= Math.ceil(cols / 2) ? .24 : -.24),
        z = -d / 2 + 2.05 + row * .88;
      desk(x, z);
      chair(x, z + .44, 0, r.floor === 3 ? mint : blue);
      if (i % 4 === 0) box(.24, .022, .18, x, .77, z, mat('#ddba7e'));
    }
    desk(-w / 2 + 1.05, -d / 2 + 1.02, 1.15);
    chair(-w / 2 + 1.05, -d / 2 + .63, Math.PI, black);
    door(w / 2 - .73, d / 2 - .13, r.name, r.id, oak, Math.PI);
    label(r.name + ' · ' + r.capacity + ' ที่นั่ง', 2.3, .32, 0, 2.77, -d / 2 + .09);
    const window = group(-w / 2 + .09, 1.88, d / 2 - 1.5, Math.PI / 2);
    box(1.7, 1.15, .03, 0, 0, 0, steel, window);
    box(1.57, 1.03, .04, 0, 0, .018, mat('#c5d9da'), window);
    for (let j = -2; j <= 2; j++) box(1.57, .023, .05, 0, j * .17, .04, white, window);
    $('title').textContent = r.name + ' · ชั้น ' + r.floor + (r.status === 'ไม่ใช้งาน' ? ' · ไม่ใช้งาน' : '');
    $('eyebrow').textContent = 'สำรวจห้องเรียน / ชั้น ' + r.floor;
    $('desc').textContent = r.status === 'ไม่ใช้งาน' ? `ห้องนี้ยังไม่เปิดใช้งาน โมเดล ${r.capacity} ที่นั่งแสดงพื้นที่เพื่อให้เห็นภาพรวม` : `ห้องเรียน ${r.capacity} ที่นั่ง พร้อมพื้นที่สอนและทางเดินระหว่างโต๊ะ ลองหมุนดูบรรยากาศได้รอบห้อง`;
    $('details').innerHTML = `<span class="badge">ห้องเรียน · ชั้น ${r.floor}</span><p><b>${r.capacity} ที่นั่ง</b><br>วางโต๊ะเรียน ${r.capacity} ตัว เก้าอี้นักเรียน ${r.capacity} ตัว</p><b>สิ่งอำนวยความสะดวก</b><ul>${r.facilities.map(f => `<li>${f.Facilities_Name} × ${f.Quantity}</li>`).join('') || '<li>ยังไม่มีรายการอุปกรณ์</li>'}</ul><div class="muted">${r.facilities.length ? 'ตำแหน่งอุปกรณ์และขนาดห้องเป็นข้อเสนอ' : 'กระดานและแอร์ในภาพเป็นข้อเสนอ ยังไม่ใช่ข้อมูลที่ยืนยัน'}<br>ข้อมูลประกอบภาพจำลอง</div>`;
    $('lobby').hidden = false;
    resetView(Math.max(w, d) * 1.85);
    updateRooms();
  }
  function buildLobby(f) {
    if (f === 1) {
      location.href = "/virtual-tour?floor=1";
      return;
    }
    clear();
    floor = f;
    current = null;
    const floorUrl = new URL(location.href);
    floorUrl.searchParams.set('floor', f);
    floorUrl.searchParams.delete('room');
    history.replaceState(history.state, '', floorUrl);
    const rs = DATA.filter(r => r.floor === f).sort((a, b) => a.name.localeCompare(b.name));
    roomShell(9, 5.6, f);
    rs.forEach((r, i) => {
      const x = -3 + i * 2.35;
      door(x, -2.71, r.name, r.id, f === 2 && i === 0 ? mat('#cebf78') : oak);
      label(r.name.replace('ห้อง ', ''), .25, .29, x + .70, 1.96, -2.62, '#e8bcae', f === 3 ? '#607b42' : '#cf773e');
    });
    shelves(3.5, .42, 1.25, 2.65, -Math.PI / 2);
    shelves(1.9, 1.91, 2.35, 1.28, Math.PI);
    desk(2.7, .9, 1.30);
    chair(2.65, 1.5, 0, mint);
    chair(1.75, 1.0, .4, blue);
    label('ชั้น ' + f, 1.0, .32, 0, 2.75, -2.62);
    $('title').textContent = 'ชั้น ' + f + ' · โถงหน้าห้อง';
    $('eyebrow').textContent = 'พื้นที่การเรียนรู้ / ชั้น ' + f;
    $('desc').textContent = f === 1 ? 'ห้องตามข้อมูลแอดมิน แยกจากเดโมโถงต้อนรับเดิม' : 'เลือกห้องจากรายการหรือแตะประตู แล้วเข้าไปสำรวจบรรยากาศการเรียนรู้ด้วยตัวเอง';
    $('details').innerHTML = `<b>${rs.length} ห้อง · ${rs.reduce((s, r) => s + r.capacity, 0)} ที่นั่งรวม</b><ul>${rs.map(r => `<li>${r.name} · ${r.capacity} ที่นั่ง${r.status === 'ไม่ใช้งาน' ? ' · ไม่ใช้งาน' : ''}</li>`).join('')}</ul><div class="muted">โถงอิงภาพถ่าย แต่ระยะและผังห้องยังเป็นแบบเสนอ ใช้เพื่อแนะนำบรรยากาศ</div>${f === 1 ? '<p><a href="/virtual-tour?floor=1">เปิดเดโมพื้นที่ต้อนรับชั้น 1 ↗</a></p>' : ''}`;
    $('lobby').hidden = true;
    resetView(18);
    updateRooms();
  }
  let yaw = .55,
    pitch = .60,
    dist = 18,
    tyaw = yaw,
    tpitch = pitch,
    tdist = 18,
    defaultDist = 18,
    target = new THREE.Vector3(0, .8, 0);
  function resetView(d = defaultDist) {
    defaultDist = d;
    tyaw = .55;
    tpitch = .60;
    tdist = mobile() ? d * Math.max(1.65, innerHeight / innerWidth * 1.08) : d;
  }
  function updateRooms() {
    $('rooms').innerHTML = DATA.filter(r => r.floor === floor).map(r => `<button class="room ${current?.id === r.id ? 'active' : ''}" data-id="${r.id}" aria-pressed="${current?.id === r.id}"><span>${r.name}</span><small>${r.capacity} ที่นั่ง${r.status === 'ไม่ใช้งาน' ? ' · ปิด' : ''}</small></button>`).join('');
    document.querySelectorAll('[data-id]').forEach(b => b.onclick = () => buildClass(DATA.find(r => r.id === +b.dataset.id)));
  }
  $('lobby').onclick = () => buildLobby(floor);
  $('reset').onclick = () => resetView();
  $('top').onclick = () => {
    tpitch = 1.48;
    tyaw = 0;
  };
  $('plus').onclick = () => tdist = Math.max(7, tdist - 1.3);
  $('minus').onclick = () => tdist = Math.min(80, tdist + 1.3);
  scene.add(new THREE.HemisphereLight('#fff6e8', '#a4abbe', .85));
  const sun = new THREE.DirectionalLight('#fff2dc', 1.6);
  sun.position.set(1, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -10,
    right: 10,
    top: 10,
    bottom: -10
  });
  sun.shadow.normalBias = .025;
  scene.add(sun);
  const ray = new THREE.Raycaster(),
    mouse = new THREE.Vector2(),
    canvas = renderer.domElement;
  let points = new Map(),
    last = null,
    moved = 0,
    pinch = 0;
  function hit(e) {
    mouse.set(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2);
    ray.setFromCamera(mouse, camera);
    return ray.intersectObjects(picks)[0];
  }
  canvas.onpointerdown = e => {
    points.set(e.pointerId, [e.clientX, e.clientY]);
    last = [e.clientX, e.clientY];
    moved = 0;
    canvas.setPointerCapture(e.pointerId);
    if (points.size === 2) {
      const [a, b] = [...points.values()];
      pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
      moved = 10;
    }
  };
  canvas.onpointermove = e => {
    if (points.has(e.pointerId)) points.set(e.pointerId, [e.clientX, e.clientY]);
    if (points.size === 2) {
      const [a, b] = [...points.values()],
        n = Math.hypot(a[0] - b[0], a[1] - b[1]);
      tdist = THREE.MathUtils.clamp(tdist + (pinch - n) * .04, 7, 80);
      pinch = n;
      return;
    }
    if (last && points.size) {
      const dx = e.clientX - last[0],
        dy = e.clientY - last[1];
      moved += Math.abs(dx) + Math.abs(dy);
      tyaw -= dx * .006;
      tpitch = THREE.MathUtils.clamp(tpitch + dy * .005, .18, 1.49);
      last = [e.clientX, e.clientY];
    } else canvas.style.cursor = hit(e) ? 'pointer' : 'grab';
  };
  canvas.onpointerup = e => {
    if (moved < 6) {
      const h = hit(e);
      if (h && !current) buildClass(DATA.find(r => r.id === h.object.userData.id));
    }
    points.delete(e.pointerId);
    last = null;
  };
  canvas.onpointercancel = e => {
    points.delete(e.pointerId);
    last = null;
  };
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    tdist = THREE.MathUtils.clamp(tdist + e.deltaY * .01, 7, 80);
  }, {
    passive: false
  });
  const onKeyDown = e => {
    if (e.target !== canvas) return;
    if (e.key.startsWith('Arrow')) e.preventDefault();
    if (e.key === 'ArrowLeft') tyaw -= .12;
    if (e.key === 'ArrowRight') tyaw += .12;
    if (e.key === 'ArrowUp') tpitch = Math.min(1.49, tpitch + .1);
    if (e.key === 'ArrowDown') tpitch = Math.max(.18, tpitch - .1);
  };
  document.addEventListener('keydown', onKeyDown);
  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight);
    resetView();
  };
  window.addEventListener('resize', onResize);
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function frame() {
    if (stopped) return;
    animationFrame = requestAnimationFrame(frame);
    const k = reduce ? 1 : .09;
    yaw += (tyaw - yaw) * k;
    pitch += (tpitch - pitch) * k;
    dist += (tdist - dist) * k;
    camera.aspect = innerWidth / innerHeight;
    camera.setViewOffset(innerWidth, innerHeight, preview ? 0 : mobile() ? 0 : -innerWidth * .10, preview ? 0 : mobile() ? -innerHeight * .10 : 0, innerWidth, innerHeight);
    camera.position.set(dist * Math.sin(yaw) * Math.cos(pitch), .8 + dist * Math.sin(pitch), dist * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    for (const w of walls) {
      const fade = camera.position[w.axis] < w.limit;
      w.mesh.material.opacity = fade ? .12 : 1;
      w.mesh.material.depthWrite = !fade;
    }
    renderer.render(scene, camera);
  }
  const requested = new URLSearchParams(location.search);
  const requestedRoom = DATA.find(r => r.id === Number(requested.get('room')));
  if (requestedRoom) {
    floor = requestedRoom.floor;
    buildClass(requestedRoom);
  } else {
    buildLobby(Number(requested.get('floor')) === 3 ? 3 : 2);
  }
  animationFrame = requestAnimationFrame(frame);
  $('loading').hidden = true;
  return () => {
    stopped = true;
    cancelAnimationFrame(animationFrame);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
