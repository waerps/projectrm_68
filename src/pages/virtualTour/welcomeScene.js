import { zones } from './welcomeContent';
// Original room geometry retained from the approved Sornserm tour.
export function mountWelcomeScene() {
  const THREE = window.THREE;
  let stopped = false;
  let animationFrame;
  const preview = new URLSearchParams(location.search).has("preview");
  const PHOTOS = {
    "0": "/tour/photos/welcome-0.jpg",
    "1": "/tour/photos/welcome-1.jpg",
    "2": "/tour/photos/welcome-2.jpg",
    "3": "/tour/photos/welcome-3.jpg",
    "4": "/tour/photos/welcome-4.jpg",
    "5": "/tour/photos/welcome-5.jpg",
    "art": "/tour/photos/welcome-6.jpg"
  };
  const $ = id => document.getElementById(id),
    isMobile = () => innerWidth < 800;
  let scene = new THREE.Scene(),
    renderer,
    camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .1, 100);
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
  } catch (e) {
    $('loading').innerHTML = 'กรุณาเปิดด้วยเบราว์เซอร์ที่รองรับ WebGL';
    throw e;
  }
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .93;
  $('room').appendChild(renderer.domElement);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'ฉากห้อง ใช้ปุ่มลูกศรหมุน และเครื่องหมายบวกลบเพื่อซูม');
  const root = new THREE.Group();
  scene.add(root);
  const pickables = [];
  function mat(c, r = .7) {
    const m = new THREE.MeshStandardMaterial({
      color: c,
      roughness: r
    });
    m.color.convertSRGBToLinear();
    return m;
  }
  const cream = mat('#eadbc0'),
    pink = mat('#dcae9e'),
    tile = mat('#e4e1d9'),
    navy = mat('#253579'),
    orange = mat('#e35d20'),
    white = mat('#f4f0e5'),
    black = mat('#303033'),
    oak = mat('#b78656'),
    lightwood = mat('#cdbc9d'),
    steel = mat('#8e9395', .35),
    sofa = mat('#cbbfa7'),
    green = mat('#386a42'),
    mint = mat('#9ac5ab'),
    blue = mat('#1686ba');
  const cache = {};
  function geom(w, h, d, round = false) {
    const key = [w, h, d, round].join();
    if (!cache[key]) {
      if (round) {
        const r = Math.min(w, h, d) * .18,
          s = new THREE.Shape();
        s.moveTo(-w / 2 + r, -h / 2);
        s.lineTo(w / 2 - r, -h / 2);
        s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
        s.lineTo(w / 2, h / 2 - r);
        s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        s.lineTo(-w / 2 + r, h / 2);
        s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
        s.lineTo(-w / 2, -h / 2 + r);
        s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
        cache[key] = new THREE.ExtrudeGeometry(s, {
          depth: d - 2 * r,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: r * .45,
          bevelThickness: r,
          curveSegments: 3
        });
        cache[key].translate(0, 0, -d / 2 + r);
      } else cache[key] = new THREE.BoxGeometry(w, h, d);
    }
    return cache[key];
  }
  function box(w, h, d, x, y, z, m = white, p = root, round = false) {
    const o = new THREE.Mesh(geom(w, h, d, round), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    p.add(o);
    return o;
  }
  function cyl(r, h, x, y, z, m = steel, p = root) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    p.add(o);
    return o;
  }
  function rod(a, b, r = .018, m = steel, p = root) {
    const aa = new THREE.Vector3(...a),
      bb = new THREE.Vector3(...b),
      v = bb.clone().sub(aa),
      o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, v.length(), 9), m);
    o.position.copy(aa.add(bb).multiplyScalar(.5));
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize());
    p.add(o);
    o.castShadow = true;
    return o;
  }
  function group(x = 0, y = 0, z = 0, ry = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry;
    root.add(g);
    return g;
  }
  function actionable(g, i) {
    g.traverse(o => {
      if (o.isMesh) {
        o.userData.zone = i;
        pickables.push(o);
      }
    });
  }
  function textTexture(lines, bg = '#253579', fg = '#fff4df', size = 1024) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size / 2;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    lines.forEach((line, i) => {
      ctx.fillStyle = i === 1 ? '#ecac59' : fg;
      ctx.font = `${i === 0 ? 'bold ' : ''}${i === 0 ? 94 : 42}px Tahoma, Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(line, c.width / 2, i === 0 ? 235 : 345);
    });
    ctx.strokeStyle = fg;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(110, 85);
    ctx.lineTo(420, 85);
    ctx.moveTo(610, 420);
    ctx.lineTo(910, 420);
    ctx.stroke();
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return new THREE.MeshStandardMaterial({
      map: t,
      roughness: .85
    });
  }
  function poster(w, h, x, y, z, m, p = root) {
    return box(w, h, .025, x, y, z, m, p);
  }
  // Floor plan is an approximation inferred from the six reference photographs.
  box(8.15, .22, 10.2, 0, -.15, 0, lightwood);
  box(8, .055, 10, 0, -.015, 0, tile);
  const grout = mat('#bcbab1');
  for (let x = -4; x <= 4; x += .5) box(.013, .008, 10, x, .017, 0, grout);
  for (let z = -5; z <= 5; z += .5) box(8, .008, .013, 0, .017, z, grout);
  const wallLeft = box(.12, 3.3, 10, -4.06, 1.65, 0, cream);
  const wallBack = box(8.1, 3.3, .12, 0, 1.65, -5.06, cream);
  for (const wall of [wallLeft, wallBack]) {
    wall.material = cream.clone();
    wall.material.transparent = true;
  }
  const rightMat = cream.clone();
  rightMat.transparent = true;
  rightMat.opacity = .12;
  rightMat.depthWrite = false;
  const wallRight = box(.12, 3.3, 10, 4.06, 1.65, 0, rightMat);
  wallRight.castShadow = false;
  box(.06, .15, 10, -3.97, .08, 0, black);
  box(8, .15, .06, 0, .08, -4.97, black);
  box(.06, .15, 10, 3.98, .08, 0, black);
  for (const x of [-3.94, 3.94]) for (const z of [-4.85, .10, 4.85]) box(.19, 3.36, .29, x, 1.68, z, pink);
  // Back storage cabinets with alternating open shelves, books and lit display.
  const storage = group(1.7, 0, -4.64);
  for (let i = 2; i < 5; i++) {
    let x = -1.64 + i * .80;
    box(.78, 2.75, .61, x, 1.4, 0, lightwood, storage);
    box(.75, .53, .63, x, 1.15, .02, black, storage);
    box(.75, .47, .64, x, 1.74, .03, white, storage);
    box(.025, 2.72, .015, x + .36, 1.4, .335, steel, storage);
    for (let j = 0; j < 5; j++) box(.07, .31 + j % 2 * .025, .22, x - .24 + j * .09, 1.70, .32, [navy, white, oak, pink, mint][j], storage);
    box(.7, .04, .68, x, 1.48, .04, black, storage);
  }
  const display = group(.84, 0, -4.62);
  box(.87, 2.8, .63, 0, 1.4, 0, white, display);
  for (let y of [.4, 1.05, 1.7, 2.37]) {
    box(.85, .08, .67, 0, y, .02, black, display);
    box(.77, .025, .52, 0, y + .06, .08, mat('#edc17f'), display);
  }
  for (let j = 0; j < 3; j++) {
    cyl(.09, .18, -.23 + j * .23, 2.57, .2, oak, display);
    cyl(.055, .15, -.23 + j * .23, 2.72, .2, mat('#c4a253', .35), display);
  }
  actionable(storage, 0);
  actionable(display, 0);
  // Reception sign and desks along the left wall.
  const sign = group(3.96, 2.22, -2.18, -Math.PI / 2);
  poster(2.8, 1.38, 0, 0, 0, textTexture(['ศรเสริม ติวเตอร์', 'SORNSERM TUTOR']), sign);
  actionable(sign, 0);
  const desk = group(2.60, 0, -2.85, 0);
  box(2.55, .09, .92, 0, .80, 0, oak, desk);
  box(2.4, .68, .07, 0, .42, .37, black, desk);
  for (let x of [-1.03, 1.03]) box(.34, .74, .79, x, .39, 0, oak, desk);
  box(.56, .04, .39, -.65, .868, .05, white, desk);
  box(.36, .025, .27, -.48, .897, .08, tile, desk);
  const laptop = group();
  root.remove(laptop);
  desk.add(laptop);
  laptop.position.set(.70, .86, 0);
  box(.52, .025, .36, 0, 0, 0, steel, laptop);
  const lap = box(.52, .32, .022, 0, .17, -.16, black, laptop);
  lap.rotation.x = -.17;
  box(.46, .25, .024, 0, .18, -.14, navy, laptop);
  cyl(.044, .14, -.2, .9, -.1, white, desk);
  for (let i = 0; i < 5; i++) rod([-.22 + i * .011, .91, -.1], [-.21 + i * .011, 1.08, -.09], .006, [navy, orange, green][i % 3], desk);
  const deskDrawer = new THREE.Group();
  desk.add(deskDrawer);
  deskDrawer.position.set(-1, .57, .10);
  box(.40, .19, .63, 0, 0, 0, oak, deskDrawer);
  box(.15, .02, .027, 0, 0, .335, black, deskDrawer);
  actionable(desk, 0);
  function chair(x, z, rotation = 0, office = false) {
    const g = group(x, 0, z, rotation);
    box(.53, .11, .50, 0, .47, 0, black, g, true);
    box(.53, .52, .085, 0, .80, -.22, black, g, true);
    if (!office) {
      for (let xx of [-.24, .24]) {
        rod([xx, .08, .22], [xx, .46, .22], .021, steel, g);
        rod([xx, .08, -.25], [xx, .77, -.23], .021, steel, g);
        rod([xx, .08, -.25], [xx, .08, .22], .021, steel, g);
        rod([xx, .67, -.14], [xx, .67, .20], .025, black, g);
      }
    } else {
      cyl(.035, .43, 0, .23, 0, black, g);
      for (let i = 0; i < 5; i++) {
        let a = i * Math.PI * 2 / 5;
        rod([0, .10, 0], [Math.sin(a) * .33, .07, Math.cos(a) * .33], .025, black, g);
      }
    }
    return g;
  }
  actionable(chair(2.60, -3.68, 0, true), 0);
  for (let x of [2.05, 3.25]) actionable(chair(x, -1.96, Math.PI), 0);
  const table = group(.36, 0, -2.75, 0);
  box(1.92, .055, .78, 0, .77, 0, white, table);
  for (let x of [-.87, .87]) for (let z of [-.31, .31]) box(.035, .75, .035, x, .38, z, black, table);
  actionable(table, 0);
  actionable(chair(-.15, -3.51, 0), 0);
  actionable(chair(.88, -1.92, Math.PI), 0);
  // Waiting benches, certificates, clock and television.
  for (let z of [1.84, 3.32]) {
    const bench = group(3.54, 0, z);
    box(.78, .40, 1.45, 0, .25, 0, sofa, bench, true);
    box(.78, .09, 1.43, 0, .49, 0, sofa, bench, true);
    for (let zz of [-.47, 0, .47]) for (let xx of [-.2, .2]) cyl(.028, .003, xx, .54, zz, lightwood, bench);
    actionable(bench, 1);
  }
  const awards = group(3.975, 0, 2.2, -Math.PI / 2);
  for (let row = 0; row < 4; row++) {
    let count = 5 - row;
    for (let j = 0; j < count; j++) {
      const x = (j - (count - 1) / 2) * .47,
        y = 1.49 + row * .38;
      box(.40, .31, .036, x, y, 0, oak, awards);
      box(.355, .267, .04, x, y, .012, white, awards);
      box(.22, .012, .045, x, y + .045, .013, steel, awards);
      box(.19, .009, .045, x, y, .013, steel, awards);
    }
  }
  actionable(awards, 2);
  const tv = group(3.78, 1.81, .08, -Math.PI / 2);
  box(1.05, .65, .075, 0, 0, 0, black, tv);
  box(.96, .55, .079, 0, 0, .011, mat('#161b22'), tv);
  actionable(tv, 1);
  const clock = group(3.80, 2.76, .08, -Math.PI / 2);
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(.23, 40), white);
  clock.add(clockFace);
  rod([0, 0, .01], [.12, .05, .01], .009, oak, clock);
  rod([0, 0, .01], [-.08, .11, .01], .009, oak, clock);
  for (let i = 0; i < 12; i++) {
    let a = i * Math.PI / 6;
    box(.015, .025, .01, Math.sin(a) * .19, Math.cos(a) * .19, .012, oak, clock);
  }
  function plant(x, z, scale = 1) {
    const g = group(x, 0, z);
    g.scale.setScalar(scale);
    cyl(.17, .31, 0, .16, 0, white, g);
    rod([0, .25, 0], [0, 1.17, 0], .015, oak, g);
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4,
        y = .38 + i * .08;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), green);
      leaf.scale.set(1, .38, 1.65);
      leaf.position.set(Math.sin(a) * .14, y, Math.cos(a) * .14);
      leaf.rotation.set(.4, a, .2);
      g.add(leaf);
    }
    return g;
  }
  actionable(plant(3.37, .68, .9), 1);
  // Snack wall: parallel wire racks, wooden shelves, colourful packets.
  const snacks = group(-3.52, 0, -1.10, Math.PI / 2);
  const packetMats = ['#e7b82c', '#dfb32d', '#b84532', '#498747', '#275e93', '#d1be8a'].map(c => mat(c));
  for (let x of [-.83, .83]) rod([x, .10, -.27], [x, 2.22, -.27], .024, steel, snacks);
  for (let row = 0; row < 5; row++) {
    const y = .25 + row * .37;
    box(1.8, .035, .64, 0, y, 0, steel, snacks);
    for (let x of [-.88, .88]) rod([x, y, .31], [x, y + .16, .31], .014, steel, snacks);
    rod([-.88, y + .12, .32], [.88, y + .12, .32], .014, steel, snacks);
    for (let j = 0; j < 7; j++) {
      const x = -.73 + j * .245;
      const packet = box(.21, .29, .13, x, y + .17, .01, packetMats[(j + row * 2) % 6], snacks, true);
      packet.rotation.z = (j % 3 - 1) * .08;
      box(.12, .074, .014, x, y + .18, .087, white, snacks, true);
      box(.17, .018, .15, x, y + .31, .01, packetMats[(j + row * 2) % 6], snacks);
    }
  }
  for (let i = 0; i < 6; i++) box(.42, .1, .44, -.6 + i % 3 * .58, 2.15 + Math.floor(i / 3) * .12, 0, [white, orange, mint][i % 3], snacks);
  actionable(snacks, 3);
  const shelf = group(-3.51, 0, -2.68, Math.PI / 2);
  for (let x of [-.57, .57]) box(.055, 1.36, .59, x, .68, 0, oak, shelf);
  for (let row = 0; row < 4; row++) {
    const y = .12 + row * .38;
    box(1.2, .04, .60, 0, y, 0, oak, shelf);
    for (let j = 0; j < 7; j++) {
      if (row < 2) {
        cyl(.045, .24, -.47 + j * .155, y + .14, .03, green, shelf);
        cyl(.025, .045, -.47 + j * .155, y + .28, .03, white, shelf);
      } else box(.13, .20, .22, -.47 + j * .155, y + .12, .01, packetMats[(row + j) % 6], shelf);
    }
  }
  actionable(shelf, 3);
  const cart = group(-2.78, 0, .38, Math.PI / 2);
  for (let x of [-.42, .42]) rod([x, .08, -.22], [x, 1.16, -.22], .02, orange, cart);
  for (let row = 0; row < 3; row++) {
    let y = .20 + row * .30;
    box(.90, .025, .50, 0, y, 0, steel, cart);
    rod([-.44, y + .12, .24], [.44, y + .12, .24], .016, steel, cart);
    for (let j = 0; j < 5; j++) box(.13, .18, .14, -.34 + j * .17, y + .10, 0, packetMats[(j + row) % 6], cart);
  }
  actionable(cart, 3);
  // Fridge with hinged upper and lower doors and stocked interior.
  const fridge = group(-3.52, 0, -4.05, Math.PI / 2);
  box(.83, 1.96, .69, 0, 1.01, 0, white, fridge, true);
  box(.73, 1.81, .035, 0, 1.02, .36, mat('#ced5d0'), fridge);
  for (let y of [.35, .77, 1.22, 1.64]) {
    box(.68, .027, .26, 0, y, .42, white, fridge);
    for (let j = 0; j < 4; j++) cyl(.045, .17, -.24 + j * .16, y + .095, .42, [green, blue, orange][j % 3], fridge);
  }
  const fridgeDoor = new THREE.Group();
  fridgeDoor.position.set(-.41, 0, .48);
  fridge.add(fridgeDoor);
  for (const spec of [[.65, 1.25], [1.67, .64]]) {
    box(.82, spec[1], .10, .41, spec[0], 0, mat('#c9cccc'), fridgeDoor, true);
    box(.035, .26, .04, .72, spec[0] + .1, .075, steel, fridgeDoor);
  }
  for (let i = 0; i < 7; i++) box(.07, .09, .009, .18 + i % 3 * .16, 1.53 + Math.floor(i / 3) * .12, .059, packetMats[i % 6], fridgeDoor);
  actionable(fridge, 3);
  const cooler = group(-2.84, 0, -3.58);
  box(.46, .98, .47, 0, .49, 0, white, cooler, true);
  box(.28, .26, .028, 0, .6, .25, steel, cooler);
  box(.16, .10, .04, 0, .87, .26, blue, cooler);
  cyl(.17, .40, 0, 1.22, 0, mat('#719cbb', .3), cooler);
  cyl(.12, .08, 0, 1.46, 0, blue, cooler);
  actionable(cooler, 3);
  // Upstairs door, located beyond the refrigerator on the back wall.
  const doorFrame = group(-.88, 0, -4.94);
  box(1.17, 2.51, .11, 0, 1.26, 0, oak, doorFrame);
  box(1.03, 2.38, .13, 0, 1.20, .02, black, doorFrame);
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-.50, 0, .10);
  doorFrame.add(doorPivot);
  box(1, 2.35, .085, .5, 1.19, 0, lightwood, doorPivot);
  box(.06, .18, .06, .88, 1.14, .085, steel, doorPivot);
  poster(.74, .36, .5, 1.9, .05, textTexture(['ห้องเรียน', 'CLASSROOMS ↑'], '#253579'), doorPivot);
  actionable(doorFrame, 5);
  // Desk and computer under the handprint artwork.
  const computerDesk = group(-3.45, 0, 3.35, Math.PI / 2);
  box(1.47, .065, .66, 0, .76, 0, black, computerDesk);
  for (let x of [-.66, .66]) box(.07, .73, .60, x, .37, 0, black, computerDesk);
  box(.47, .33, .32, -.44, .96, 0, white, computerDesk);
  box(.41, .045, .26, -.44, .93, .16, black, computerDesk);
  box(.34, .02, .21, -.44, .953, .26, white, computerDesk);
  box(.4, .025, .16, .33, .80, .21, steel, computerDesk);
  rod([.31, .8, -.02], [.31, 1.09, -.02], .025, black, computerDesk);
  box(.59, .37, .045, .31, 1.18, -.04, black, computerDesk);
  box(.54, .31, .048, .31, 1.18, -.031, mat('#55595a'), computerDesk);
  actionable(computerDesk, 4);
  const greenChair = group(-2.60, 0, 3.40, -Math.PI / 2);
  box(.47, .06, .46, 0, .44, 0, mint, greenChair, true);
  box(.48, .48, .07, 0, .72, -.20, mint, greenChair, true);
  for (let x of [-.2, .2]) for (let z of [-.18, .18]) rod([x, .02, z], [x, .44, z], .025, mint, greenChair);
  actionable(greenChair, 4);
  const art = group(-3.96, 2.08, 2.20, Math.PI / 2);
  poster(2.15, .94, 0, 0, 0, oak, art);
  const artTexture = new THREE.TextureLoader().load(PHOTOS.art);
  artTexture.encoding = THREE.sRGBEncoding;
  poster(2.07, .87, 0, 0, .025, new THREE.MeshStandardMaterial({
    map: artTexture,
    roughness: 1
  }), art);
  actionable(art, 4);
  const fan = group(-2.91, 0, 1.32);
  cyl(.30, .07, 0, .045, 0, black, fan);
  cyl(.022, 1.20, 0, .66, 0, black, fan);
  const fanHead = new THREE.Group();
  fan.add(fanHead);
  fanHead.position.y = 1.40;
  fanHead.rotation.y = -.6;
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(.33, .019, 8, 40), black);
  fanHead.add(fanRing);
  const fanBlades = new THREE.Group();
  fanHead.add(fanBlades);
  for (let i = 0; i < 3; i++) {
    let b = box(.13, .26, .025, 0, .135, 0, black, fanBlades, true);
    b.rotation.z = i * Math.PI * 2 / 3;
    b.position.set(Math.sin(-i * Math.PI * 2 / 3) * .14, Math.cos(i * Math.PI * 2 / 3) * .14, 0);
  }
  for (let i = 0; i < 12; i++) {
    let a = i * Math.PI / 6;
    rod([0, 0, .045], [Math.sin(a) * .32, Math.cos(a) * .32, .025], .004, steel, fanHead);
  }
  actionable(fan, 3);
  const stools = group(-2.70, 0, 2.12);
  for (let y of [.32, .37, .42]) {
    cyl(.27, .06, 0, y, 0, blue, stools);
  }
  for (let x of [-.18, .18]) for (let z of [-.18, .18]) rod([x, .025, z], [x, .34, z], .03, blue, stools);

  // Second printer beside the existing workstation, close to the entrance glass.
  const extraPrinter = group(-3.45, 0, 4.36, Math.PI / 2);
  box(.60, .055, .66, 0, .76, 0, black, extraPrinter);
  for (let x of [-.26, .26]) box(.045, .73, .59, x, .37, 0, black, extraPrinter);
  box(.48, .56, .42, 0, 1.07, 0, white, extraPrinter, true);
  box(.40, .06, .035, 0, 1.19, .225, black, extraPrinter);
  box(.35, .022, .29, 0, .94, .23, white, extraPrinter);
  box(.40, .045, .35, 0, 1.37, -.015, steel, extraPrinter);
  box(.11, .065, .015, .13, 1.28, .222, navy, extraPrinter);
  actionable(extraPrinter, 4);
  // Fill the trolley's baskets: packets at the back, jars and snacks at the front.
  for (let row = 0; row < 3; row++) {
    const y = .20 + row * .30;
    for (let j = 0; j < 5; j++) {
      const x = -.34 + j * .17;
      const bag = box(.135, .20, .085, x, y + .12, -.15, packetMats[(j + row + 2) % 6], cart, true);
      bag.rotation.z = (j % 3 - 1) * .09;
      box(.075, .06, .01, x, y + .13, -.101, white, cart);
      cyl(.054, .13, x, y + .08, .15, packetMats[(j + row + 4) % 6], cart);
      cyl(.055, .015, x, y + .155, .15, steel, cart);
    }
    for (let j = 0; j < 10; j++) rod([-.43 + j * .095, y, .245], [-.43 + j * .095, y + .14, .245], .007, steel, cart);
  }
  // Wire rack depth, stacked packets, small hanging products and floor baskets.
  for (let row = 0; row < 5; row++) for (let j = 0; j < 7; j++) {
    let x = -.73 + j * .245,
      y = .25 + row * .37;
    box(.20, .26, .12, x, y + .15, -.19, packetMats[(j + row + 3) % 6], snacks, true);
    box(.10, .06, .013, x, y + .16, -.123, white, snacks);
  }
  for (let j = 0; j < 8; j++) {
    const x = -.78 + j * .22;
    box(.12, .23, .045, x, .99, .37, packetMats[(j + 2) % 6], snacks, true);
    box(.07, .045, .012, x, 1.02, .397, white, snacks);
  }
  for (let j = 0; j < 3; j++) {
    const basket = group(-2.88, 0, -1.78 + j * .48);
    cyl(.18, .105, 0, .075, 0, mat(['#db96a5', '#e39baf', '#ccb68b'][j]), basket);
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      const candy = box(.045, .065, .085, Math.sin(a) * .10, .15, Math.cos(a) * .10, packetMats[(k + j) % 6], basket, true);
      candy.rotation.y = a;
    }
    actionable(basket, 3);
  }
  actionable(cart, 3);
  actionable(snacks, 3);
  // Shrink-wrapped drinking-water packs and beverage cartons beside the fridge area.
  const waterGlass = mat('#bedee3', .25);
  waterGlass.transparent = true;
  waterGlass.opacity = .66;
  const wrap = mat('#d3eaf0', .2);
  wrap.transparent = true;
  wrap.opacity = .14;
  wrap.depthWrite = false;
  const supplies = group(-2.35, 0, -4.48);
  for (let stack = 0; stack < 2; stack++) for (let level = 0; level < (stack ? 2 : 3); level++) {
    const x = stack * .55 - .27,
      y = .025 + level * .34;
    box(.49, .027, .53, x, y, 0, lightwood, supplies);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
      const xx = x - .15 + a * .15,
        zz = -.17 + b * .17;
      cyl(.057, .23, xx, y + .14, zz, waterGlass, supplies);
      cyl(.027, .055, xx, y + .28, zz, waterGlass, supplies);
      cyl(.030, .029, xx, y + .32, zz, a % 2 ? blue : green, supplies);
      cyl(.059, .065, xx, y + .14, zz, level % 2 ? white : green, supplies);
    }
    box(.49, .33, .53, x, y + .17, 0, wrap, supplies);
  }
  for (let level = 0; level < 3; level++) {
    box(.43, .25, .50, .64, .15 + level * .26, 0, oak, supplies);
    for (let j = 0; j < 3; j++) box(.12, .17, .02, .49 + j * .14, .16 + level * .26, .26, packetMats[(j + level) % 6], supplies);
  }
  actionable(supplies, 3);

  // Front entrance: low-cut sliding glass with orange bands; ceiling omitted for exploration.
  const glass = new THREE.MeshStandardMaterial({
    color: '#b8d2cf',
    transparent: true,
    opacity: .17,
    roughness: .14,
    depthWrite: false
  });
  for (const x of [-2.15, 2.15]) {
    box(3.55, .89, .025, x, .56, 4.94, glass);
    box(3.58, .11, .08, x, .13, 4.94, orange);
    box(3.58, .025, .06, x, 1.02, 4.94, steel);
  }
  for (let x of [-3.96, -.37, .37, 3.96]) box(.045, 1.06, .08, x, .55, 4.94, steel);
  box(1.45, .019, .55, 0, .04, 4.5, mat('#8e9396'));
  for (let j = 0; j < 14; j++) box(1.37, .007, .015, 0, .053, 4.26 + j * .035, black);
  const ambient = new THREE.HemisphereLight('#fff7e7', '#a6adbd', .78);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff2d7', 1.55);
  sun.position.set(-3, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -9,
    right: 9,
    top: 10,
    bottom: -9
  });
  sun.shadow.normalBias = .027;
  sun.shadow.bias = -.0001;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#dce5ff', .45);
  fill.position.set(7, 5, -2);
  scene.add(fill);
  let yaw = .65,
    pitch = .68,
    dist = 22,
    tyaw = yaw,
    tpitch = pitch,
    tdist = dist,
    target = new THREE.Vector3(0, .7, 0),
    ttarget = target.clone(),
    selected = -1,
    auto = false,
    showLabels = true,
    lastFocus = null;
  function homeDistance() {
    return preview ? 21 : isMobile() ? Math.max(24, 21 * (innerHeight / innerWidth) / 1.08) : 22;
  }
  dist = tdist = homeDistance();
  function home() {
    selected = -1;
    tyaw = .65;
    tpitch = .68;
    tdist = homeDistance();
    ttarget.set(0, .7, 0);
    closePanel();
    updateNav();
  }
  function updateCamera() {
    camera.aspect = innerWidth / innerHeight;
    camera.setViewOffset(innerWidth, innerHeight, preview ? 0 : isMobile() ? 0 : selected >= 0 ? innerWidth * .025 : -innerWidth * .10, preview ? 0 : isMobile() ? selected >= 0 ? innerHeight * .12 : -innerHeight * .07 : -innerHeight * .008, innerWidth, innerHeight);
    camera.position.set(target.x + dist * Math.sin(yaw) * Math.cos(pitch), target.y + dist * Math.sin(pitch), target.z + dist * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    for (const [wall, fade] of [[wallLeft, camera.position.x < -4], [wallBack, camera.position.z < -5]]) {
      wall.material.opacity = fade ? .10 : 1;
      wall.material.depthWrite = !fade;
      wall.castShadow = !fade;
    }
  }
  function toast(text) {
    $('toast').textContent = text;
    $('toast').style.opacity = 1;
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => $('toast').style.opacity = 0, 2600);
  }
  function updateNav() {
    document.querySelectorAll('.zone').forEach((b, i) => {
      b.classList.toggle('active', i - 1 === selected);
      b.setAttribute('aria-pressed', i - 1 === selected);
    });
    document.querySelectorAll('.hotspot').forEach((b, i) => b.classList.toggle('active', i === selected));
  }
  function selectZone(i) {
    selected = i;
    const z = zones[i];
    auto = false;
    $('rotate').classList.remove('active');
    $('rotate').setAttribute('aria-pressed', 'false');
    lastFocus = document.activeElement;
    ttarget.set(...z.target);
    tyaw = z.angle;
    tpitch = .48;
    tdist = isMobile() ? 24 : 16;
    $('category').textContent = z.en;
    $('title').textContent = z.title;
    $('description').textContent = z.desc;
    $('features').innerHTML = z.features.map(s => `<div class="detail">${s}</div>`).join('');
    $('features').innerHTML += i === 5 ? '<nav class="room-links" aria-label="ไปห้องเรียน"><a href="/virtual-tour?room=1">ชั้น 1 · ห้อง 1 · 8 ที่นั่ง →</a><a href="/virtual-tour?room=90004">ชั้น 1 · ห้อง 0 · ไม่ใช้งาน →</a><a href="/virtual-tour?floor=2">ไปชั้น 2 · ห้อง 2–4 →</a><a href="/virtual-tour?floor=3">ไปชั้น 3 · ห้อง 5–7 →</a></nav>' : '';
    $('photo').innerHTML = z.photo === null ? '<div class="photo-placeholder">↗<br>ทางขึ้นห้องเรียน<br>เลือกชั้นและห้องที่อยากชม</div>' : `<img src="${PHOTOS[z.photo]}" alt="${z.title} — ภาพสถานที่จริง">`;
    $('panel').scrollTop = 0;
    $('panel').classList.add('open');
    $('panel').inert = false;
    document.getElementById('virtual-tour-page').classList.add('detail-open');
    $('close').focus({
      preventScroll: true
    });
    updateNav();
    $('dock').children[i + 1].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }
  function closePanel() {
    $('panel').classList.remove('open');
    $('panel').inert = true;
    document.getElementById('virtual-tour-page').classList.remove('detail-open');
    if (lastFocus?.focus) lastFocus.focus({
      preventScroll: true
    });
  }
  $('dock').innerHTML = '<button class="zone active" aria-pressed="true"><span>⌂</span>ภาพรวม</button>' + zones.map((z, i) => `<button class="zone" aria-pressed="false"><span>0${i + 1}</span>${z.name}</button>`).join('');
  [...$('dock').children].forEach((b, i) => b.onclick = () => i === 0 ? home() : selectZone(i - 1));
  zones.forEach((z, i) => {
    const b = document.createElement('button');
    b.className = 'hotspot';
    b.innerHTML = `<b>0${i + 1}</b>${z.name}`;
    b.setAttribute('aria-label', z.title);
    b.onclick = () => selectZone(i);
    $('hotspots').appendChild(b);
  });
  $('close').onclick = closePanel;
  $('reset').onclick = home;
  $('tour').onclick = () => selectZone(selected < 0 ? 0 : (selected + 1) % zones.length);
  $('plus').onclick = () => tdist = Math.max(6, tdist - 1.5);
  $('minus').onclick = () => tdist = Math.min(80, tdist + 1.5);
  $('top').onclick = () => {
    closePanel();
    ttarget.set(0, 0, 0);
    tyaw = 0;
    tpitch = 1.48;
    tdist = homeDistance();
    toast('มองพื้นที่จากด้านบน');
  };
  $('rotate').onclick = () => {
    auto = !auto;
    $('rotate').classList.toggle('active', auto);
    $('rotate').setAttribute('aria-pressed', auto);
  };
  $('labels').onclick = () => {
    showLabels = !showLabels;
    $('labels').setAttribute('aria-pressed', showLabels);
  };
  const ray = new THREE.Raycaster(),
    mouse = new THREE.Vector2(),
    canvas = renderer.domElement;
  function hit(e) {
    mouse.set(e.clientX / innerWidth * 2 - 1, 1 - e.clientY / innerHeight * 2);
    ray.setFromCamera(mouse, camera);
    return ray.intersectObjects(pickables)[0];
  }
  const pointers = new Map();
  let last = null,
    totalMove = 0,
    pinch = 0;
  canvas.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    last = [e.clientX, e.clientY];
    totalMove = 0;
    canvas.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
      totalMove = 10;
    }
  });
  canvas.addEventListener('pointermove', e => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()],
        n = Math.hypot(a[0] - b[0], a[1] - b[1]);
      tdist = THREE.MathUtils.clamp(tdist + (pinch - n) * .035, 6, 80);
      pinch = n;
      totalMove = 10;
      return;
    }
    if (last && pointers.size) {
      let dx = e.clientX - last[0],
        dy = e.clientY - last[1];
      totalMove += Math.abs(dx) + Math.abs(dy);
      tyaw -= dx * .006;
      tpitch = THREE.MathUtils.clamp(tpitch + dy * .004, .18, 1.49);
      last = [e.clientX, e.clientY];
      auto = false;
    } else canvas.style.cursor = hit(e) ? 'pointer' : 'grab';
  });
  canvas.addEventListener('pointerup', e => {
    if (totalMove < 6 && pointers.size === 1) {
      const h = hit(e);
      if (h) selectZone(h.object.userData.zone);
    }
    pointers.delete(e.pointerId);
    last = null;
  });
  canvas.addEventListener('pointercancel', e => {
    pointers.delete(e.pointerId);
    last = null;
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    tdist = THREE.MathUtils.clamp(tdist + e.deltaY * .009, 6, 80);
  }, {
    passive: false
  });
  const onKeyDown = e => {
    if (e.key === 'Escape') closePanel();
    if (e.target !== canvas) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowLeft') tyaw -= .12;
    if (e.key === 'ArrowRight') tyaw += .12;
    if (e.key === 'ArrowUp') tpitch = Math.min(1.49, tpitch + .08);
    if (e.key === 'ArrowDown') tpitch = Math.max(.18, tpitch - .08);
    if (e.key === '+') $('plus').click();
    if (e.key === '-') $('minus').click();
  };
  document.addEventListener('keydown', onKeyDown);
  let oldMobile = isMobile();
  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight);
    if (oldMobile !== isMobile() && selected < 0) tdist = homeDistance();
    oldMobile = isMobile();
    updateCamera();
  };
  window.addEventListener('resize', onResize);
  const v = new THREE.Vector3(),
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastTime = 0;
  function animate(t) {
    if (stopped) return;
    animationFrame = requestAnimationFrame(animate);
    const dt = Math.min((t - lastTime) / 1000, .05) || .016;
    lastTime = t;
    const k = reduced ? 1 : 1 - Math.exp(-dt * 6);
    if (auto && !reduced) tyaw += dt * .13;
    yaw += (tyaw - yaw) * k;
    pitch += (tpitch - pitch) * k;
    dist += (tdist - dist) * k;
    target.lerp(ttarget, k);
    if (!reduced) fanBlades.rotation.z -= dt * 4;
    updateCamera();
    renderer.render(scene, camera);
    zones.forEach((z, i) => {
      const b = $('hotspots').children[i];
      v.set(...z.pos).project(camera);
      const x = (v.x * .5 + .5) * innerWidth,
        y = (.5 - v.y * .5) * innerHeight;
      const visible = showLabels && !$('panel').classList.contains('open') && v.z < 1 && x > 30 && x < innerWidth - 30 && y > 100 && y < innerHeight - 130;
      b.style.display = visible ? 'flex' : 'none';
      b.style.left = Math.max(5, Math.min(innerWidth - 125, x)) + 'px';
      b.style.top = y + 'px';
    });
  }
  animationFrame = requestAnimationFrame(animate);
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
