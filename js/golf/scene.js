/**
 * Three.js golf theater — realistic fairway, lighting, eased physics-driven motion.
 * Depends: THREE, GolfPhysics, GolfVisual, GolfAudio (classic scripts).
 */
(function () {
  "use strict";

  var P = typeof GolfPhysics !== "undefined" ? GolfPhysics : null;
  var V = typeof GolfVisual !== "undefined" ? GolfVisual : null;
  var THREE_NS = typeof THREE !== "undefined" ? THREE : null;
  var AudioFactory = typeof GolfAudio !== "undefined" ? GolfAudio : null;

  if (!P) {
    console.error("GolfPhysics missing");
    return;
  }

  var state = {
    renderer: null,
    scene: null,
    camera: null,
    ball: null,
    golfer: null,
    golferParts: null,
    poMesh: null,
    holeMesh: null,
    clock: null,
    elapsed: 0,
    playing: true,
    config: null,
    statusEl: null,
    canvas: null,
    started: false,
    portalShown: false,
    routingEl: null,
    audio: null,
    sun: null,
  };

  function $(sel) {
    return document.querySelector(sel);
  }

  function showFileHint() {
    var hint = $("[data-file-hint]");
    if (hint) hint.hidden = false;
  }

  function isFileProtocol() {
    return String(location.protocol || "").toLowerCase() === "file:";
  }

  function setTextureColorSpace(tex) {
    if (tex && THREE_NS.SRGBColorSpace) tex.colorSpace = THREE_NS.SRGBColorSpace;
    return tex;
  }

  function makeSkyTexture() {
    var c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext("2d");
    var g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, "#4a90c8");
    g.addColorStop(0.45, "#7eb6e0");
    g.addColorStop(0.72, "#a8d4f0");
    g.addColorStop(1, "#d8ece8");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    for (var i = 0; i < 18; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (0.08 + Math.random() * 0.12) + ")";
      ctx.beginPath();
      ctx.arc(
        Math.random() * c.width,
        Math.random() * c.height * 0.55,
        20 + Math.random() * 40,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    return setTextureColorSpace(new THREE_NS.CanvasTexture(c));
  }

  function makeGrassTexture(base, stripe, spacing) {
    var c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    var ctx = c.getContext("2d");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = stripe;
    ctx.lineWidth = 2;
    var step = spacing || 10;
    for (var y = 0; y < c.height; y += step) {
      ctx.globalAlpha = 0.35 + (y % (step * 2) === 0 ? 0.2 : 0);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y + 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var tex = new THREE_NS.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE_NS.RepeatWrapping;
    tex.repeat.set(6, 14);
    return setTextureColorSpace(tex);
  }

  function makeRoughTexture() {
    var c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#1f4d28";
    ctx.fillRect(0, 0, c.width, c.height);
    for (var i = 0; i < 900; i++) {
      var shade = 30 + Math.floor(Math.random() * 40);
      ctx.fillStyle = "rgb(" + shade + "," + (80 + Math.random() * 40) + "," + shade + ")";
      ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
    }
    var tex = new THREE_NS.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE_NS.RepeatWrapping;
    tex.repeat.set(12, 12);
    return setTextureColorSpace(tex);
  }

  function makeBallTexture() {
    var c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#f6f6f2";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    for (var i = 0; i < 120; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    return setTextureColorSpace(new THREE_NS.CanvasTexture(c));
  }

  function makePOTexture() {
    var c = document.createElement("canvas");
    c.width = 512;
    c.height = 360;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#f4f0e4";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
    ctx.fillStyle = "#111";
    ctx.font = "bold 40px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PURCHASE ORDER", c.width / 2, 68);
    ctx.font = "20px Helvetica, Arial, sans-serif";
    ctx.fillStyle = "#333";
    ctx.fillText("PO-7741  ·  GOLF OPS", c.width / 2, 105);
    ctx.beginPath();
    ctx.moveTo(48, 125);
    ctx.lineTo(c.width - 48, 125);
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.font = "17px Helvetica, Arial, sans-serif";
    ctx.fillStyle = "#444";
    var lines = [
      "Vendor: Fairway Supplies Co.",
      "Item: Official Tournament Balls",
      "Qty: 12 dozen",
      "Amount: $1,284.00",
      "Status: PENDING APPROVAL",
      "",
      "Authorized signature: ___________",
    ];
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 56, 162 + i * 26);
    }
    ctx.fillStyle = "rgba(200,40,40,0.9)";
    ctx.font = "bold 26px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("APPROVED?", c.width / 2, c.height - 32);
    return setTextureColorSpace(new THREE_NS.CanvasTexture(c));
  }

  function buildSky(scene) {
    var skyTex = makeSkyTexture();
    var sky = new THREE_NS.Mesh(
      new THREE_NS.SphereGeometry(120, 32, 16),
      new THREE_NS.MeshBasicMaterial({ map: skyTex, side: THREE_NS.BackSide, fog: false })
    );
    sky.position.set(0, 8, 40);
    scene.add(sky);
  }

  function buildLankyGolfer() {
    var prop = P.lankyProportions();
    var skinSpec = V ? V.materialSpec("skin") : { roughness: 0.68 };
    var clubSpec = V ? V.materialSpec("clubMetal") : { metalness: 0.88, roughness: 0.22 };

    var skin = new THREE_NS.MeshStandardMaterial({
      color: 0xc68642,
      roughness: skinSpec.roughness,
      metalness: skinSpec.metalness || 0.02,
    });
    var shirt = new THREE_NS.MeshStandardMaterial({
      color: 0xf5f5f2,
      roughness: 0.58,
      metalness: 0.01,
    });
    var pants = new THREE_NS.MeshStandardMaterial({
      color: 0x1a3355,
      roughness: 0.72,
      metalness: 0.02,
    });
    var shoe = new THREE_NS.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.42,
      metalness: 0.08,
    });

    var root = new THREE_NS.Group();
    root.name = "tallLankyGolfer";

    var hipsPivot = new THREE_NS.Group();
    hipsPivot.position.y = prop.legLength;
    root.add(hipsPivot);

    var legGeo = new THREE_NS.CapsuleGeometry(0.068, prop.legLength - 0.14, 8, 12);
    var leftLeg = new THREE_NS.Mesh(legGeo, pants);
    leftLeg.position.set(-0.1, prop.legLength / 2, 0);
    leftLeg.castShadow = true;
    var rightLeg = new THREE_NS.Mesh(legGeo, pants);
    rightLeg.position.set(0.1, prop.legLength / 2, 0);
    rightLeg.castShadow = true;
    root.add(leftLeg, rightLeg);

    var hips = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(prop.hipWidth, 0.12, 0.18),
      pants
    );
    hips.position.y = 0;
    hips.castShadow = true;
    hipsPivot.add(hips);

    var torsoPivot = new THREE_NS.Group();
    torsoPivot.position.y = 0.06;
    hipsPivot.add(torsoPivot);

    var torso = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(prop.shoulderWidth * 0.85, prop.torsoHeight, 0.22),
      shirt
    );
    torso.position.y = prop.torsoHeight / 2;
    torso.castShadow = true;
    torsoPivot.add(torso);

    var armGeo = new THREE_NS.CapsuleGeometry(0.042, prop.armLength - 0.1, 8, 10);
    var leftArm = new THREE_NS.Mesh(armGeo, skin);
    leftArm.position.set(-prop.shoulderWidth / 2 - 0.02, prop.torsoHeight * 0.65, 0);
    leftArm.rotation.z = 0.18;
    leftArm.castShadow = true;

    var rightArmPivot = new THREE_NS.Group();
    rightArmPivot.position.set(prop.shoulderWidth / 2 + 0.02, prop.torsoHeight * 0.78, 0.02);
    var rightArm = new THREE_NS.Mesh(armGeo, skin);
    rightArm.position.y = -prop.armLength / 2;
    rightArm.castShadow = true;
    rightArmPivot.add(rightArm);
    torsoPivot.add(leftArm, rightArmPivot);

    var head = new THREE_NS.Mesh(
      new THREE_NS.SphereGeometry(prop.headRadius, 24, 18),
      skin
    );
    head.position.y = prop.torsoHeight + prop.headRadius + 0.04;
    head.castShadow = true;
    torsoPivot.add(head);

    var cap = new THREE_NS.Mesh(
      new THREE_NS.CylinderGeometry(0.125, 0.135, 0.055, 16),
      new THREE_NS.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    cap.position.copy(head.position);
    cap.position.y += 0.08;
    var brim = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(0.16, 0.02, 0.12),
      new THREE_NS.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.55 })
    );
    brim.position.set(0, -0.01, 0.1);
    cap.add(brim);
    torsoPivot.add(cap);

    var shoeGeo = new THREE_NS.BoxGeometry(0.11, 0.055, 0.24);
    var ls = new THREE_NS.Mesh(shoeGeo, shoe);
    ls.position.set(-0.1, 0.03, 0.04);
    var rs = new THREE_NS.Mesh(shoeGeo, shoe);
    rs.position.set(0.1, 0.03, 0.04);
    root.add(ls, rs);

    var club = new THREE_NS.Group();
    club.name = "driver";
    var shaft = new THREE_NS.Mesh(
      new THREE_NS.CylinderGeometry(0.011, 0.014, 1.18, 10),
      new THREE_NS.MeshStandardMaterial({
        color: 0x2a2a2a,
        metalness: clubSpec.metalness,
        roughness: clubSpec.roughness,
      })
    );
    shaft.position.y = -0.56;
    var headClub = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(0.14, 0.055, 0.32),
      new THREE_NS.MeshStandardMaterial({
        color: 0xc8ccd0,
        metalness: 0.92,
        roughness: 0.18,
      })
    );
    headClub.position.set(0, -1.15, 0.06);
    club.add(shaft, headClub);
    club.position.set(0, -prop.armLength * 0.12, 0);
    rightArmPivot.add(club);

    var putter = new THREE_NS.Group();
    putter.name = "putter";
    var pshaft = new THREE_NS.Mesh(
      new THREE_NS.CylinderGeometry(0.01, 0.012, 0.95, 10),
      new THREE_NS.MeshStandardMaterial({ color: 0x222222, metalness: 0.6, roughness: 0.28 })
    );
    pshaft.position.y = -0.45;
    var phead = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(0.15, 0.035, 0.075),
      new THREE_NS.MeshStandardMaterial({
        color: 0x9aa0a6,
        metalness: 0.78,
        roughness: 0.22,
      })
    );
    phead.position.set(0, -0.92, 0.02);
    putter.add(pshaft, phead);
    putter.visible = false;
    rightArmPivot.add(putter);

    root.userData = {
      hipsPivot: hipsPivot,
      torsoPivot: torsoPivot,
      rightArmPivot: rightArmPivot,
      leftArm: leftArm,
      club: club,
      putter: putter,
      leftLeg: leftLeg,
      rightLeg: rightLeg,
      prop: prop,
    };
    return root;
  }

  function buildCourse(scene) {
    var fairwayTex = makeGrassTexture("#3d8f45", "#46a34f", 9);
    var greenTex = makeGrassTexture("#52b85c", "#5fc968", 6);
    var roughTex = makeRoughTexture();
    var fringeTex = makeGrassTexture("#48a050", "#3f8f48", 7);

    var fairwaySpec = V ? V.materialSpec("fairway") : { roughness: 0.84 };
    var roughSpec = V ? V.materialSpec("rough") : { roughness: 0.95 };
    var greenSpec = V ? V.materialSpec("green") : { roughness: 0.62 };

    var ground = new THREE_NS.Mesh(
      new THREE_NS.PlaneGeometry(90, 100),
      new THREE_NS.MeshStandardMaterial({
        map: roughTex,
        color: 0x2a5c30,
        roughness: roughSpec.roughness,
        metalness: 0,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.08, 32);
    ground.receiveShadow = true;
    scene.add(ground);

    var fairway = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(12, 0.12, 54),
      new THREE_NS.MeshStandardMaterial({
        map: fairwayTex,
        color: 0xffffff,
        roughness: fairwaySpec.roughness,
        metalness: fairwaySpec.metalness,
      })
    );
    fairway.position.set(0, -0.02, 25);
    fairway.receiveShadow = true;
    scene.add(fairway);

    var roughL = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(8, 0.1, 54),
      new THREE_NS.MeshStandardMaterial({
        map: roughTex,
        color: 0x3a6b3e,
        roughness: 0.96,
      })
    );
    roughL.position.set(-10, -0.04, 25);
    roughL.receiveShadow = true;
    var roughR = roughL.clone();
    roughR.position.x = 10;
    scene.add(roughL, roughR);

    var green = new THREE_NS.Mesh(
      new THREE_NS.CylinderGeometry(6.2, 6.2, 0.14, 64),
      new THREE_NS.MeshStandardMaterial({
        map: greenTex,
        color: 0xffffff,
        roughness: greenSpec.roughness,
        metalness: greenSpec.metalness,
      })
    );
    green.position.set(P.LAYOUT.greenCenter.x, 0.01, P.LAYOUT.greenCenter.z);
    green.receiveShadow = true;
    scene.add(green);

    var fringe = new THREE_NS.Mesh(
      new THREE_NS.TorusGeometry(6.35, 0.55, 10, 56),
      new THREE_NS.MeshStandardMaterial({
        map: fringeTex,
        color: 0xffffff,
        roughness: 0.76,
      })
    );
    fringe.rotation.x = Math.PI / 2;
    fringe.position.set(0, 0.02, P.LAYOUT.greenCenter.z);
    fringe.receiveShadow = true;
    scene.add(fringe);

    var tee = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(2.6, 0.08, 2.6),
      new THREE_NS.MeshStandardMaterial({
        map: fairwayTex,
        color: 0x8bc34a,
        roughness: 0.8,
      })
    );
    tee.position.set(0, 0.02, 0);
    tee.receiveShadow = true;
    scene.add(tee);

    var hole = new THREE_NS.Mesh(
      new THREE_NS.CylinderGeometry(
        P.LAYOUT.holeRadius,
        P.LAYOUT.holeRadius * 0.85,
        0.18,
        32
      ),
      new THREE_NS.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 })
    );
    hole.position.set(P.LAYOUT.hole.x, -0.02, P.LAYOUT.hole.z);
    scene.add(hole);

    var cupRim = new THREE_NS.Mesh(
      new THREE_NS.TorusGeometry(P.LAYOUT.holeRadius + 0.02, 0.025, 8, 40),
      new THREE_NS.MeshStandardMaterial({ color: 0x2e5d32, roughness: 0.7 })
    );
    cupRim.rotation.x = Math.PI / 2;
    cupRim.position.set(P.LAYOUT.hole.x, 0.01, P.LAYOUT.hole.z);
    scene.add(cupRim);

    var flagPole = new THREE_NS.Mesh(
      new THREE_NS.CylinderGeometry(0.018, 0.018, 1.85, 12),
      new THREE_NS.MeshStandardMaterial({ color: 0xf5f5f5, metalness: 0.45, roughness: 0.35 })
    );
    flagPole.position.set(P.LAYOUT.hole.x, 0.92, P.LAYOUT.hole.z);
    flagPole.castShadow = true;
    var flag = new THREE_NS.Mesh(
      new THREE_NS.PlaneGeometry(0.52, 0.32),
      new THREE_NS.MeshStandardMaterial({
        color: 0xe53935,
        side: THREE_NS.DoubleSide,
        roughness: 0.5,
      })
    );
    flag.position.set(0.27, 0.62, 0);
    flagPole.add(flag);
    scene.add(flagPole);

    var poTex = makePOTexture();
    var po = P.LAYOUT.purchaseOrder;
    var poSpec = V ? V.materialSpec("poPaper") : { roughness: 0.42 };
    var paperSide = new THREE_NS.MeshStandardMaterial({
      color: 0xe8e2d4,
      roughness: poSpec.roughness,
    });
    var paperTop = new THREE_NS.MeshStandardMaterial({
      map: poTex,
      roughness: 0.38,
      metalness: 0,
    });
    var poMesh = new THREE_NS.Mesh(
      new THREE_NS.BoxGeometry(po.width, po.height, po.depth),
      [paperSide, paperSide, paperTop, paperSide, paperSide, paperSide]
    );
    poMesh.castShadow = true;
    poMesh.receiveShadow = true;
    poMesh.name = "purchaseOrder";
    poMesh.visible = false;
    scene.add(poMesh);

    var treeMat = new THREE_NS.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.88 });
    var trunkMat = new THREE_NS.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.92 });
    function tree(x, z, s) {
      var g = new THREE_NS.Group();
      var trunk = new THREE_NS.Mesh(
        new THREE_NS.CylinderGeometry(0.12 * s, 0.18 * s, 1.4 * s, 8),
        trunkMat
      );
      trunk.position.y = 0.7 * s;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      var leaves = new THREE_NS.Mesh(
        new THREE_NS.ConeGeometry(0.95 * s, 2.5 * s, 10),
        treeMat
      );
      leaves.position.y = 2.2 * s;
      leaves.castShadow = true;
      g.add(trunk, leaves);
      g.position.set(x, 0, z);
      scene.add(g);
    }
    tree(-8.5, 10, 1.25);
    tree(9.5, 18, 1.45);
    tree(-10, 32, 1.15);
    tree(11, 38, 1.35);
    tree(-7.5, 49, 1.05);
    tree(8.5, 54, 1.3);
    tree(-12, 22, 0.95);

    return { poMesh: poMesh, hole: hole };
  }

  function buildBall(scene) {
    var ballSpec = V ? V.materialSpec("ball") : { roughness: 0.38 };
    var ball = new THREE_NS.Mesh(
      new THREE_NS.SphereGeometry(0.042, 32, 24),
      new THREE_NS.MeshStandardMaterial({
        map: makeBallTexture(),
        color: 0xffffff,
        roughness: ballSpec.roughness,
        metalness: ballSpec.metalness || 0.04,
      })
    );
    ball.castShadow = true;
    ball.name = "golfBall";
    ball.position.set(P.LAYOUT.tee.x, P.LAYOUT.tee.y, P.LAYOUT.tee.z);
    scene.add(ball);
    return ball;
  }

  function phaseLabel(phase) {
    var map = {
      tee: "Address the ball",
      drive_swing: "Pure swing — load and fire",
      drive_flight: "Striped — physics on rails",
      drive_land: "Soft land on the dance floor",
      putt_setup: "On the green — reads the line",
      po_fall: "Incoming… purchase order from the sky",
      putt_stroke: "Putt stroke — dead on line",
      putt_roll: "Rolling true toward the cup…",
      po_bounce: "CLANG — off the PO",
      miss_settle: "Miss. Procurement wins.",
      walk_to_po: "Walking over to pick up the paper",
      pickup_po: "Picks up the purchase order",
      done: "Paper in hand — choose your route",
    };
    return map[phase] || phase;
  }

  function showRoutingSlip() {
    var el = state.routingEl || $("[data-routing-slip]");
    if (!el) return;
    state.routingEl = el;
    el.hidden = false;
    state.portalShown = true;
    document.body.classList.add("routing-open");
    var first = el.querySelector(".route-card");
    if (first && first.focus) {
      try {
        first.focus();
      } catch (e) {}
    }
    if (window.__GOLF_STATE__) window.__GOLF_STATE__.portalOpen = true;
  }

  function hideRoutingSlip() {
    var el = state.routingEl || $("[data-routing-slip]");
    if (el) el.hidden = true;
    state.portalShown = false;
    document.body.classList.remove("routing-open");
    if (window.__GOLF_STATE__) window.__GOLF_STATE__.portalOpen = false;
  }

  function updateStatus(sample) {
    if (!state.statusEl) return;
    state.statusEl.textContent =
      phaseLabel(sample.phase) +
      (sample.hitPO ? " · PO contact" : "") +
      (sample.poHeld ? " · holding paper" : "");
    state.statusEl.dataset.phase = sample.phase;
    state.statusEl.dataset.hitPo = sample.hitPO ? "1" : "0";
    state.statusEl.dataset.portal = state.portalShown ? "1" : "0";
  }

  function placeGolfer(sample) {
    var g = state.golfer;
    if (!g) return;
    var ud = g.userData;
    var gp = sample.golfer;
    var pose = V ? V.golferPoseChannels(sample) : {};

    g.position.set(gp.pos.x, gp.pos.y, gp.pos.z);
    g.rotation.y = gp.facing;

    ud.hipsPivot.rotation.y = pose.hip || 0;
    ud.torsoPivot.rotation.x = pose.torsoLean || 0;

    var pivot = ud.rightArmPivot;
    if (gp.onGreen) {
      ud.club.visible = false;
      ud.putter.visible = !sample.poHeld;
      pivot.rotation.x = gp.shoulder;
      pivot.rotation.z = 0.12;
      pivot.rotation.y = 0;
      ud.leftArm.rotation.x = -(pose.armSwing || 0);
      if (sample.phase === "walk_to_po") {
        var w = sample.golfer.walk;
        ud.leftLeg.rotation.x = Math.sin(w * Math.PI * 4) * 0.48;
        ud.rightLeg.rotation.x = Math.sin(w * Math.PI * 4 + Math.PI) * 0.48;
        ud.leftLeg.rotation.x += pose.kneeL || 0;
        ud.rightLeg.rotation.x += pose.kneeR || 0;
      } else {
        ud.leftLeg.rotation.x = pose.kneeL || 0;
        ud.rightLeg.rotation.x = pose.kneeR || 0;
      }
    } else {
      ud.club.visible = true;
      ud.putter.visible = false;
      pivot.rotation.x = gp.shoulder;
      pivot.rotation.z = 0.22 + gp.swing * 0.18;
      pivot.rotation.y = gp.wrist * 0.28;
      ud.leftArm.rotation.x = -gp.swing * 0.35;
      ud.leftLeg.rotation.x = pose.kneeL || 0;
      ud.rightLeg.rotation.x = -(pose.kneeR || gp.swing * 0.18);
    }
  }

  function placePO(sample) {
    if (!state.poMesh) return;
    var po = sample.po;
    state.poMesh.visible = !!po.visible;
    if (!po.visible) return;
    state.poMesh.position.set(po.x, po.y, po.z);
    state.poMesh.rotation.set(po.rotX || 0, po.rotY || 0, po.rotZ || 0);
  }

  function cameraTargetForPhase(sample) {
    var phase = sample.phase;
    var pos = new THREE_NS.Vector3();
    var target = new THREE_NS.Vector3();
    var fov = 48;

    if (phase === "tee" || phase === "drive_swing") {
      pos.set(5.8, 2.35, -4.8);
      target.set(0.15, 1.05, 1.2);
    } else if (phase === "drive_flight") {
      fov = 52;
      pos.set(8.2, 3.8 + sample.ball.y * 0.12, sample.ball.z - 11);
      target.set(sample.ball.x, sample.ball.y * 0.45 + 0.55, sample.ball.z + 2.5);
    } else if (phase === "drive_land" || phase === "putt_setup") {
      pos.set(3.8, 2.1, sample.ball.z - 5.5);
      target.set(0, 0.45, P.LAYOUT.greenCenter.z + 0.5);
    } else if (phase === "po_fall") {
      pos.set(3.0, 3.5, 47);
      target.set(sample.po.x, sample.po.y * 0.35 + 0.2, sample.po.z);
    } else if (
      phase === "putt_stroke" ||
      phase === "putt_roll" ||
      phase === "po_bounce" ||
      phase === "miss_settle"
    ) {
      pos.set(2.2, 1.45, sample.ball.z - 2.6);
      target.set(
        sample.ball.x * 0.25,
        0.18,
        (sample.ball.z + P.LAYOUT.purchaseOrder.z) * 0.48
      );
      if (phase === "po_bounce") {
        pos.y += 0.08;
        target.y += 0.05;
      }
    } else if (phase === "walk_to_po" || phase === "pickup_po") {
      pos.set(sample.golfer.pos.x + 2.4, 1.55, sample.golfer.pos.z - 2.2);
      target.set(sample.po.x, sample.po.y + 0.25, sample.po.z);
    } else {
      pos.set(sample.golfer.pos.x + 2.5, 1.65, sample.golfer.pos.z - 2.4);
      target.set(sample.po.x, 1.05, sample.po.z);
    }

    return { pos: pos, target: target, fov: fov };
  }

  function applySample(sample) {
    if (state.ball) {
      state.ball.position.set(sample.ball.x, sample.ball.y, sample.ball.z);
      if (
        sample.phase === "drive_flight" ||
        sample.phase === "putt_roll" ||
        sample.phase === "miss_settle"
      ) {
        state.ball.rotation.x += 0.22;
        state.ball.rotation.z += 0.1;
      }
    }
    placeGolfer(sample);
    placePO(sample);
    updateStatus(sample);

    if (state.audio) state.audio.syncFromSample(sample);

    if (state.camera) {
      var cam = state.camera;
      var camPlan = cameraTargetForPhase(sample);
      var lerpAmt = V ? V.cameraLerpForPhase(sample.phase) : 0.1;

      cam.position.lerp(camPlan.pos, lerpAmt);
      if (!cam.userData.look) cam.userData.look = camPlan.target.clone();
      cam.userData.look.lerp(camPlan.target, lerpAmt);
      cam.lookAt(cam.userData.look);
      cam.fov += (camPlan.fov - cam.fov) * 0.06;
      cam.updateProjectionMatrix();
    }

    if (sample.portalReady && !state.portalShown) {
      showRoutingSlip();
      state.playing = false;
    }

    window.__GOLF_STATE__ = {
      phase: sample.phase,
      hitPO: sample.hitPO,
      inHole: sample.inHole,
      ball: sample.ball,
      po: sample.po,
      poHeld: sample.poHeld,
      portalReady: sample.portalReady,
      portalOpen: state.portalShown,
      elapsed: state.elapsed,
      totalDuration: sample.totalDuration,
      audioCues: sample.audioCues,
    };
  }

  function tick() {
    if (!state.started) {
      requestAnimationFrame(tick);
      return;
    }
    if (state.playing) {
      var dt = state.clock.getDelta();
      if (dt > 0.05) dt = 0.05;
      state.elapsed += dt;
      var sample = P.sampleSimulation(state.elapsed, state.config);
      applySample(sample);
    }
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
    requestAnimationFrame(tick);
  }

  function step(seconds) {
    state.elapsed += seconds;
    var sample = P.sampleSimulation(state.elapsed, state.config);
    applySample(sample);
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
    return sample;
  }

  function seek(elapsed) {
    state.elapsed = elapsed;
    if (state.clock && state.clock.getDelta) state.clock.getDelta();
    var sample = P.sampleSimulation(state.elapsed, state.config);
    applySample(sample);
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
    return sample;
  }

  function setPlaying(on) {
    state.playing = !!on;
    if (state.clock && state.clock.getDelta) state.clock.getDelta();
    return state.playing;
  }

  function replayFromStart() {
    hideRoutingSlip();
    state.elapsed = 0;
    state.playing = true;
    state.portalShown = false;
    if (state.audio) state.audio.reset();
    if (state.clock && state.clock.getDelta) state.clock.getDelta();
    applySample(P.sampleSimulation(0, state.config));
    if (state.renderer && state.scene && state.camera) {
      state.renderer.render(state.scene, state.camera);
    }
  }

  function init() {
    if (isFileProtocol()) showFileHint();

    if (!THREE_NS) {
      console.error("THREE missing");
      var err = $("[data-load-error]");
      if (err) {
        err.hidden = false;
        err.textContent = "Three.js failed to load. Serve over HTTP.";
      }
      return;
    }

    state.config = P.createSequenceConfig();
    state.statusEl = $("[data-golf-status]");
    state.routingEl = $("[data-routing-slip]");
    if (AudioFactory) state.audio = AudioFactory.createGolfAudio();

    var mount = $("[data-golf-canvas]") || document.body;
    var renderer = new THREE_NS.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(
      mount.clientWidth || window.innerWidth,
      mount.clientHeight || window.innerHeight
    );
    renderer.shadowMap.enabled = true;
    if (THREE_NS.PCFSoftShadowMap) {
      renderer.shadowMap.type = THREE_NS.PCFSoftShadowMap;
    }
    if (THREE_NS.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE_NS.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
    }
    renderer.setClearColor(0x7eb6e0, 1);
    mount.appendChild(renderer.domElement);
    state.renderer = renderer;
    state.canvas = renderer.domElement;
    state.canvas.dataset.golfCanvas = "1";

    var scene = new THREE_NS.Scene();
    scene.fog = new THREE_NS.Fog(0x9ec8e8, 38, 105);
    state.scene = scene;

    var camera = new THREE_NS.PerspectiveCamera(
      48,
      (mount.clientWidth || window.innerWidth) /
        (mount.clientHeight || window.innerHeight),
      0.1,
      220
    );
    camera.position.set(5.8, 2.35, -4.8);
    camera.lookAt(0, 1, 2);
    state.camera = camera;

    buildSky(scene);
    scene.add(new THREE_NS.HemisphereLight(0xc8e4ff, 0x3d5c34, 0.75));
    scene.add(new THREE_NS.AmbientLight(0x8aa8c0, 0.22));

    var sun = new THREE_NS.DirectionalLight(0xfff0d8, 1.25);
    sun.position.set(22, 32, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.00015;
    sun.shadow.normalBias = 0.02;
    sun.shadow.camera.near = 2;
    sun.shadow.camera.far = 95;
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    scene.add(sun);
    state.sun = sun;

    var fill = new THREE_NS.DirectionalLight(0xb8d4f0, 0.35);
    fill.position.set(-12, 14, -8);
    scene.add(fill);

    var course = buildCourse(scene);
    state.poMesh = course.poMesh;
    state.holeMesh = course.hole;
    state.ball = buildBall(scene);
    state.golfer = buildLankyGolfer();
    scene.add(state.golfer);

    state.clock = new THREE_NS.Clock();
    state.started = true;
    state.elapsed = 0;

    window.addEventListener("resize", function () {
      var w = mount.clientWidth || window.innerWidth;
      var h = mount.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    function unlockAudio() {
      if (state.audio) state.audio.unlock();
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    }
    document.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    var muteBtn = $("[data-golf-mute]");
    if (muteBtn && state.audio) {
      muteBtn.addEventListener("click", function () {
        var next = !state.audio.isMuted();
        state.audio.setMuted(next);
        muteBtn.textContent = next ? "Unmute" : "Mute";
        muteBtn.setAttribute("aria-pressed", next ? "true" : "false");
      });
    }

    var replay = $("[data-golf-replay]");
    if (replay) replay.addEventListener("click", replayFromStart);
    var portalReplay = $("[data-routing-replay]");
    if (portalReplay) portalReplay.addEventListener("click", replayFromStart);

    document.addEventListener("keydown", function (e) {
      if ((e.key === "r" || e.key === "R") && state.portalShown) {
        replayFromStart();
      }
    });

    applySample(P.sampleSimulation(0, state.config));
    renderer.render(scene, camera);
    requestAnimationFrame(tick);

    window.__GOLF__ = {
      step: step,
      seek: seek,
      setPlaying: setPlaying,
      showPortal: showRoutingSlip,
      hidePortal: hideRoutingSlip,
      replay: replayFromStart,
      getState: function () {
        return window.__GOLF_STATE__;
      },
      physics: P,
      visual: V,
      config: state.config,
      audio: state.audio,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();