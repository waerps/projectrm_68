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
  const initialParams = new URLSearchParams(location.search);
  const initialRoom = DATA.find(r => r.id === Number(initialParams.get('room')));
  let world,
    picks = [],
    walls = [],
    floor = initialRoom?.floor ?? (Number(initialParams.get('floor')) === 3 ? 3 : 2),
    current = null;
  const guidePointsByFloor = { 2: [
    { name: 'ห้องเรียน 2', title: 'ห้องเรียน 2', roomName: 'ห้อง 2', desc: 'ขึ้นบันไดมาแล้วพบห้อง 2 อยู่ตรงหน้า ข้างประตูมีตู้เตี้ยสำหรับจัดเก็บเอกสาร', photo: '/tour/photos/floor2-room2.png', pos: [-1.6, 1.8, -4.65], angle: -.28 },
    { name: 'ห้องเรียน 3', title: 'ห้องเรียน 3', roomName: 'ห้อง 3', desc: 'ห้อง 3 อยู่ฝั่งขวาของโถง ถัดจากมุมจัดเก็บเอกสาร', photo: '/tour/photos/floor2-rooms34.png', pos: [2.75, 1.8, -.35], angle: -.45 },
    { name: 'ห้องเรียน 4', title: 'ห้องเรียน 4', roomName: 'ห้อง 4', desc: 'ห้อง 4 อยู่ถัดจากห้อง 3 ตามแนวโถงด้านขวา', photo: '/tour/photos/floor2-rooms34.png', pos: [2.75, 1.8, 2], angle: -.55 },
    { name: 'มุมจัดเก็บเอกสาร', title: 'มุมจัดเก็บเอกสาร', desc: 'ตู้เตี้ยและตู้สูงสำหรับจัดเก็บเอกสารอยู่บนผนังฝั่งขวา ก่อนถึงห้อง 3 และ 4', photo: '/tour/photos/floor2-rooms34.png', pos: [2.4, 1.5, -2.65], angle: -.48 }
  ], 3: [
    { name: 'ห้องเรียน 5', title: 'ห้องเรียน 5', roomName: 'ห้อง 5', desc: 'ขึ้นบันไดมาจะพบห้อง 5 อยู่ตรงหน้า ทางซ้ายของห้อง 6', photo: '/tour/photos/floor3-rooms.png', pos: [-.05, 1.8, -2.5], angle: -.25 },
    { name: 'ห้องเรียน 6', title: 'ห้องเรียน 6', roomName: 'ห้อง 6', desc: 'ห้อง 6 อยู่ตรงหน้าบันได ถัดจากห้อง 5', photo: '/tour/photos/floor3-rooms.png', pos: [1.45, 1.8, -2.5], angle: -.25 },
    { name: 'ห้องเรียน 7', title: 'ห้องเรียน 7', roomName: 'ห้อง 7', desc: 'ห้อง 7 อยู่ทางขวามือของโถงชั้น 3', photo: '/tour/photos/floor3-lobby.png', pos: [2.75, 1.8, -1.05], angle: -.5 }
  ] };
  const activeGuides = () => guidePointsByFloor[floor] || [];
  let selectedGuide = -1;
  let autoRotate = false;
  let showGuides = true;
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
    const left = box(.12, 3.05, d, -w / 2, 1.5, 0, f === 3 ? pink : cream);
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
    closeGuide();
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
    closeGuide();
    clear();
    floor = f;
    current = null;
    const floorUrl = new URL(location.href);
    floorUrl.searchParams.set('floor', f);
    floorUrl.searchParams.delete('room');
    history.replaceState(history.state, '', floorUrl);
    const rs = DATA.filter(r => r.floor === f).sort((a, b) => a.name.localeCompare(b.name));
    const lobbyWidth = f === 2 ? 5.6 : 5.8;
    const lobbyDepth = f === 2 ? 9.6 : 5.2;
    roomShell(lobbyWidth, lobbyDepth, f);
    if (f === 2) {
      // From the stairs (open front), room 2 is ahead; rooms 3 and 4 are on the right.
      const room2 = rs.find(r => r.name === 'ห้อง 2');
      if (room2) {
        door(-1.6, -lobbyDepth / 2 + .09, room2.name, room2.id, mat('#cebf78'));
        label('2', .25, .29, -.9, 1.96, -lobbyDepth / 2 + .18, '#e8bcae', '#cf773e');
      }
      shelves(.65, -lobbyDepth / 2 + .4, 1.65, 1.28);
      const rightX = lobbyWidth / 2;
      const rightWall = box(.12, 3.05, lobbyDepth, rightX, 1.5, 0, pink);
      rightWall.material = rightWall.material.clone();
      rightWall.material.transparent = true;
      walls.push({ mesh: rightWall, axis: 'x', limit: rightX, reverse: true });
      // Low then tall cabinet run along the room 3/4 wall before the doors.
      shelves(rightX - .38, -3.65, 2.0, 1.28, -Math.PI / 2);
      shelves(rightX - .38, -1.95, 1.35, 2.65, -Math.PI / 2);
      const rightRooms = rs.filter(r => r.name === 'ห้อง 3' || r.name === 'ห้อง 4');
      rightRooms.forEach((r, i) => {
        const z = -.35 + i * 2.35;
        door(rightX - .07, z, r.name, r.id, oak, -Math.PI / 2);
        // A number beside each door faces the landing, like the room signs on site.
        const sign = group(rightX - .12, 1.96, z + .7, -Math.PI / 2);
        label(r.name.replace('ห้อง ', ''), .25, .29, 0, 0, 0, '#e8bcae', '#cf773e', sign);
      });
      const studyArea = group(0, 0, -2.4, -Math.PI / 2);
      desk(0, 0, 1.30, studyArea);
      chair(-.4, .7, 0, mint, studyArea);
      chair(.4, .7, 0, blue, studyArea);
    } else {
      // The third floor is a small landing: rooms 5 and 6 face the stairs,
      // while room 7 turns off to the right.
      for (const [name, x] of [['ห้อง 5', -.05], ['ห้อง 6', 1.45]]) {
        const room = rs.find(r => r.name === name);
        if (!room) continue;
        door(x, -lobbyDepth / 2 + .09, room.name, room.id, oak);
        label(room.name.replace('ห้อง ', ''), .25, .29, x - .7, 1.96, -lobbyDepth / 2 + .18, '#e8bcae', name === 'ห้อง 5' ? '#cf773e' : '#607b42');
      }
      const rightX = lobbyWidth / 2;
      const rightWall = box(.12, 3.05, lobbyDepth, rightX, 1.5, 0, white);
      rightWall.material = rightWall.material.clone();
      rightWall.material.transparent = true;
      walls.push({ mesh: rightWall, axis: 'x', limit: rightX, reverse: true });
      const room7 = rs.find(r => r.name === 'ห้อง 7');
      if (room7) {
        door(rightX - .07, -1.05, room7.name, room7.id, oak, -Math.PI / 2);
        const sign = group(rightX - .12, 1.96, -.35, -Math.PI / 2);
        label('7', .25, .29, 0, 0, 0, '#e8bcae', '#607b42', sign);
      }
      // The small table sits on the same back wall, to the left of room 5.
      desk(-1.85, -2.15, 1.35);
      chair(-1.85, -1.4, 0, mint);
    }
    label('ชั้น ' + f, 1.0, .32, f === 2 ? 0 : -1.2, 2.75, -lobbyDepth / 2 + .18);
    $('title').textContent = 'ชั้น ' + f + ' · โถงหน้าห้อง';
    $('eyebrow').textContent = 'พื้นที่การเรียนรู้ / ชั้น ' + f;
    $('desc').textContent = f === 1 ? 'ห้องตามข้อมูลแอดมิน แยกจากเดโมโถงต้อนรับเดิม' : 'เลือกห้องจากรายการหรือแตะประตู แล้วเข้าไปสำรวจบรรยากาศการเรียนรู้ด้วยตัวเอง';
    $('details').innerHTML = `<b>${rs.length} ห้อง · ${rs.reduce((s, r) => s + r.capacity, 0)} ที่นั่งรวม</b><ul>${rs.map(r => `<li>${r.name} · ${r.capacity} ที่นั่ง${r.status === 'ไม่ใช้งาน' ? ' · ไม่ใช้งาน' : ''}</li>`).join('')}</ul><div class="muted">โถงอิงภาพถ่าย แต่ระยะและผังห้องยังเป็นแบบเสนอ ใช้เพื่อแนะนำบรรยากาศ</div>${f === 1 ? '<p><a href="/virtual-tour?floor=1">เปิดเดโมพื้นที่ต้อนรับชั้น 1 ↗</a></p>' : ''}`;
    $('lobby').hidden = true;
    resetView(f === 3 ? 13 : 18);
    updateRooms();
  }
  let yaw = .55,
    pitch = .60,
    dist = 18,
    tyaw = yaw,
    tpitch = pitch,
    tdist = 18,
    defaultDist = 18,
    target = new THREE.Vector3(0, .8, 0),
    ttarget = target.clone();
  function resetView(d = defaultDist) {
    defaultDist = d;
    ttarget.set(0, .8, 0);
    tyaw = !current ? -.45 : .55;
    tpitch = .60;
    tdist = mobile() ? d * Math.max(1.65, innerHeight / innerWidth * 1.08) : d;
  }
  function updateRooms() {
    const lobbyButton = `<button class="room ${current ? '' : 'active'}" id="floorLobby" aria-pressed="${!current}"><span>โถงชั้น ${floor}</span><small>หน้าห้อง ${floor === 2 ? '2–4' : '5–7'}</small></button>`;
    $('rooms').innerHTML = lobbyButton + DATA.filter(r => r.floor === floor).map(r => `<button class="room ${current?.id === r.id ? 'active' : ''}" data-id="${r.id}" aria-pressed="${current?.id === r.id}"><span>${r.name}</span><small>${r.capacity} ที่นั่ง${r.status === 'ไม่ใช้งาน' ? ' · ปิด' : ''}</small></button>`).join('');
    $('floorLobby').onclick = () => buildLobby(floor);
    document.querySelectorAll('[data-id]').forEach(b => b.onclick = () => buildClass(DATA.find(r => r.id === +b.dataset.id)));
  }
  function updateGuideNav() {
    document.querySelectorAll('#guideDock .zone').forEach((button, i) => {
      button.classList.toggle('active', i === selectedGuide);
      button.setAttribute('aria-pressed', String(i === selectedGuide));
    });
  }
  function closeGuide() {
    const panel = $('guidePanel');
    if (!panel) return;
    panel.classList.remove('open');
    panel.inert = true;
    selectedGuide = -1;
    updateGuideNav();
  }
  function selectGuide(i) {
    if (!$('guidePanel')) return;
    if (current) buildLobby(floor);
    const point = activeGuides()[i];
    const room = DATA.find(r => r.name === point.roomName && r.floor === floor);
    selectedGuide = i;
    autoRotate = false;
    $('rotate').classList.remove('active');
    $('rotate').setAttribute('aria-pressed', 'false');
    ttarget.set(...point.pos);
    tyaw = point.angle;
    tpitch = .48;
    tdist = mobile() ? 17 : 12.5;
    $('guideCategory').textContent = `0${i + 1} / ชั้น ${floor}`;
    $('guideTitle').textContent = point.title;
    $('guideDescription').textContent = point.desc;
    $('guidePhoto').innerHTML = `<img src="${point.photo}" alt="${point.title} — ภาพสถานที่จริง">`;
    $('guideDetails').innerHTML = room
      ? `<span class="badge">ห้องเรียน · ชั้น ${floor}</span><p><b>${room.capacity} ที่นั่ง</b><br>วางโต๊ะเรียน ${room.capacity} ตัว เก้าอี้นักเรียน ${room.capacity} ตัว</p><b>สิ่งอำนวยความสะดวก</b><ul>${room.facilities.map(f => `<li>${f.Facilities_Name} × ${f.Quantity}</li>`).join('') || '<li>ยังไม่มีรายการอุปกรณ์</li>'}</ul><div class="muted">ตำแหน่งอุปกรณ์และขนาดห้องเป็นข้อเสนอ<br>ข้อมูลประกอบภาพจำลอง</div><button class="secondary guide-enter" id="guideEnter" type="button">เข้าชม${room.name} →</button>`
      : '<div class="detail">ตู้เตี้ยและตู้สูงอยู่เรียงกันบนผนังฝั่งห้อง 3–4</div><div class="detail">มีตู้เตี้ยอีกหนึ่งใบอยู่ข้างห้อง 2</div>';
    if (room) $('guideEnter').onclick = () => buildClass(room);
    $('guidePanel').scrollTop = 0;
    $('guidePanel').classList.add('open');
    $('guidePanel').inert = false;
    updateGuideNav();
    $('guideClose').focus({ preventScroll: true });
  }
  if ($('guideDock')) {
    const guides = activeGuides();
    $('guideDock').innerHTML = guides.map((point, i) => `<button class="zone" type="button" aria-pressed="false"><span>0${i + 1}</span>${point.name}</button>`).join('');
    [...$('guideDock').children].forEach((button, i) => button.onclick = () => selectGuide(i));
    guides.forEach((point, i) => {
      const button = document.createElement('button');
      button.className = 'hotspot';
      button.type = 'button';
      button.innerHTML = `<b>0${i + 1}</b>${point.name}`;
      button.setAttribute('aria-label', `แนะนำ${point.name}`);
      button.onclick = () => selectGuide(i);
      $('guideHotspots').appendChild(button);
    });
    $('guideTour').onclick = () => selectGuide((selectedGuide + 1) % guides.length);
    $('guideClose').onclick = closeGuide;
    $('rotate').onclick = () => {
      autoRotate = !autoRotate;
      $('rotate').classList.toggle('active', autoRotate);
      $('rotate').setAttribute('aria-pressed', String(autoRotate));
    };
    $('labels').onclick = () => {
      showGuides = !showGuides;
      $('labels').setAttribute('aria-pressed', String(showGuides));
    };
  }
  $('lobby').onclick = () => buildLobby(floor);
  $('reset').onclick = () => { closeGuide(); resetView(); };
  $('top').onclick = () => {
    closeGuide();
    ttarget.set(0, .8, 0);
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
  const guidePosition = new THREE.Vector3();
  let lastFrameTime = 0;
  function frame(time) {
    if (stopped) return;
    animationFrame = requestAnimationFrame(frame);
    const dt = lastFrameTime ? Math.min((time - lastFrameTime) / 1000, .05) : .016;
    lastFrameTime = time;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 6);
    if (autoRotate && !reduce && !current) tyaw += dt * .13;
    yaw += (tyaw - yaw) * k;
    pitch += (tpitch - pitch) * k;
    dist += (tdist - dist) * k;
    target.lerp(ttarget, k);
    camera.aspect = innerWidth / innerHeight;
    camera.setViewOffset(innerWidth, innerHeight, preview ? 0 : mobile() ? 0 : selectedGuide >= 0 ? innerWidth * .025 : -innerWidth * .10, preview ? 0 : mobile() ? selectedGuide >= 0 ? innerHeight * .12 : -innerHeight * .10 : 0, innerWidth, innerHeight);
    camera.position.set(target.x + dist * Math.sin(yaw) * Math.cos(pitch), target.y + dist * Math.sin(pitch), target.z + dist * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    for (const w of walls) {
      const fade = w.reverse ? camera.position[w.axis] > w.limit : camera.position[w.axis] < w.limit;
      w.mesh.material.opacity = fade ? .12 : 1;
      w.mesh.material.depthWrite = !fade;
    }
    renderer.render(scene, camera);
    if ($('guideHotspots')) activeGuides().forEach((point, i) => {
      const button = $('guideHotspots').children[i];
      guidePosition.set(...point.pos).project(camera);
      const x = (guidePosition.x * .5 + .5) * innerWidth;
      const y = (.5 - guidePosition.y * .5) * innerHeight;
      const visible = showGuides && !current && !$('guidePanel').classList.contains('open') && guidePosition.z < 1 && x > (mobile() ? 25 : 310) && x < innerWidth - 35 && y > 130 && y < innerHeight - 130;
      button.style.display = visible ? 'flex' : 'none';
      if (visible) {
        button.style.left = x + 'px';
        button.style.top = y + 'px';
      }
    });
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
