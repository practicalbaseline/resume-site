/**
 * Pure golf simulation — phase machine, ball flight, PO fall/bounce, walk/pickup.
 * No Three.js / Web Audio. Unit-testable under Node.
 * Coords: +Z down fairway, Y up, X right.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GolfPhysics = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var PHASES = [
    "tee",
    "drive_swing",
    "drive_flight",
    "drive_land",
    "putt_setup",
    "po_fall",
    "putt_stroke",
    "putt_roll",
    "po_bounce",
    "miss_settle",
    "walk_to_po",
    "pickup_po",
    "done",
  ];

  var PHASE_INDEX = {};
  for (var i = 0; i < PHASES.length; i++) {
    PHASE_INDEX[PHASES[i]] = i;
  }

  /** Audio cue ids fired once per phase localT threshold (deterministic). */
  var AUDIO_CUES = [
    { id: "whoosh", phase: "drive_swing", at: 0.72 },
    { id: "impact", phase: "drive_flight", at: 0.0 },
    { id: "land", phase: "drive_land", at: 0.05 },
    { id: "putt_tap", phase: "putt_stroke", at: 0.55 },
    { id: "po_flutter", phase: "po_fall", at: 0.05 },
    { id: "po_land", phase: "po_fall", at: 0.92 },
    { id: "po_bounce", phase: "po_bounce", at: 0.05 },
    { id: "pickup", phase: "pickup_po", at: 0.45 },
  ];

  var LAYOUT = {
    tee: { x: 0, y: 0.05, z: 0 },
    greenCenter: { x: 0, y: 0.02, z: 48 },
    hole: { x: 0, y: 0, z: 52.2 },
    holeRadius: 0.108,
    purchaseOrder: {
      x: 0.02,
      y: 0.03,
      z: 50.45,
      width: 0.78,
      height: 0.035,
      depth: 0.55,
    },
    poSky: { x: 0.02, y: 14, z: 50.45 },
    fairwayHalfWidth: 6,
    greenRadius: 5.5,
    puttStartOffset: { x: 0.12, y: 0.04, z: 46.9 },
  };

  function clamp01(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return t;
  }

  function easeInOut(t) {
    var u = clamp01(t);
    return u * u * (3 - 2 * u);
  }

  function easeOutCubic(t) {
    var u = clamp01(t);
    return 1 - Math.pow(1 - u, 3);
  }

  function easeInQuad(t) {
    var u = clamp01(t);
    return u * u;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpVec(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t),
    };
  }

  /**
   * Physics-style drive: gravity arc with slight draw, peak mid-flight.
   * y = y0 + vy0*t - 0.5*g*t^2 remapped to start/end on ground.
   */
  function driveBallPosition(t, start, end, peakHeight) {
    var u = clamp01(t);
    // Ease forward speed: faster mid-flight feel
    var zT = easeOutCubic(u);
    var x = start.x + (end.x - start.x) * zT;
    var z = start.z + (end.z - start.z) * zT;
    var peak = peakHeight == null ? 16 : peakHeight;
    // Physics-ish parabola peaking slightly past mid
    var apexU = 0.42;
    var yGround = start.y + (end.y - start.y) * zT;
    var arc;
    if (u <= apexU) {
      var a = u / apexU;
      arc = peak * (1 - (1 - a) * (1 - a));
    } else {
      var b = (u - apexU) / (1 - apexU);
      arc = peak * (1 - b * b);
    }
    return { x: x, y: yGround + arc, z: z };
  }

  function defaultDriveLanding() {
    return {
      x: LAYOUT.puttStartOffset.x,
      y: LAYOUT.puttStartOffset.y,
      z: LAYOUT.puttStartOffset.z,
    };
  }

  function puttBallPosition(t, start, hole) {
    var u = clamp01(t);
    // Slight deceleration toward cup
    var s = easeOutCubic(u);
    return {
      x: start.x + (hole.x - start.x) * s,
      y: start.y,
      z: start.z + (hole.z - start.z) * s,
    };
  }

  /**
   * PO falling from sky: flutter + gravity land at rest pose.
   * @param {number} t 0..1
   */
  function poFallPosition(t, sky, rest) {
    var u = clamp01(t);
    var g = easeInQuad(u);
    var y = sky.y + (rest.y - sky.y) * g;
    // Paper flutter
    var flutter = Math.sin(u * Math.PI * 5) * (1 - u) * 0.35;
    var spin = u * Math.PI * 2.2;
    return {
      x: sky.x + flutter * 0.4,
      y: y,
      z: sky.z + Math.sin(u * Math.PI * 3) * 0.15 * (1 - u),
      rotX: -0.2 + Math.sin(spin) * 0.5 * (1 - u * 0.7),
      rotY: spin * 0.35,
      rotZ: Math.sin(spin * 1.3) * 0.4 * (1 - u),
    };
  }

  function purchaseOrderBounds(po) {
    var p = po || LAYOUT.purchaseOrder;
    var hw = p.width / 2;
    var hd = p.depth / 2;
    return {
      minX: p.x - hw,
      maxX: p.x + hw,
      minZ: p.z - hd,
      maxZ: p.z + hd,
      y: p.y + (p.height || 0.03) / 2,
      center: { x: p.x, y: p.y, z: p.z },
    };
  }

  function intersectsPurchaseOrder(pos, po, ballRadius) {
    var b = purchaseOrderBounds(po);
    var r = ballRadius == null ? 0.042 : ballRadius;
    return (
      pos.x + r >= b.minX &&
      pos.x - r <= b.maxX &&
      pos.z + r >= b.minZ &&
      pos.z - r <= b.maxZ
    );
  }

  function puttPathHitsPO(start, hole, po, ballRadius) {
    var samples = 80;
    for (var i = 0; i <= samples; i++) {
      var t = i / samples;
      var p = puttBallPosition(t, start, hole);
      if (intersectsPurchaseOrder(p, po, ballRadius)) return t;
    }
    return null;
  }

  function bounceOffPurchaseOrder(velocity, restitution) {
    var e = restitution == null ? 0.58 : restitution;
    return {
      x: velocity.x + 0.12,
      y: Math.max(0.04, Math.abs(velocity.z) * 0.15 * e),
      z: -Math.abs(velocity.z) * e,
    };
  }

  function settleAfterBounce(origin, velocity, t, durationSeconds) {
    var u = clamp01(t);
    var dur = durationSeconds || 1.5;
    var damp = 1 - u * 0.88;
    return {
      x: origin.x + velocity.x * u * dur * damp,
      y: Math.max(0.04, origin.y + velocity.y * Math.sin(u * Math.PI) * 0.4),
      z: origin.z + velocity.z * u * dur * damp,
    };
  }

  function isInHole(pos, hole, holeRadius) {
    var h = hole || LAYOUT.hole;
    var r = holeRadius == null ? LAYOUT.holeRadius : holeRadius;
    var dx = pos.x - h.x;
    var dz = pos.z - h.z;
    return dx * dx + dz * dz <= r * r && pos.y <= 0.06;
  }

  function createSequenceConfig(overrides) {
    var o = overrides || {};
    var driveEnd = o.driveEnd || defaultDriveLanding();
    var tee = o.tee || LAYOUT.tee;
    var hole = o.hole || LAYOUT.hole;
    var po = o.purchaseOrder || LAYOUT.purchaseOrder;
    var poSky = o.poSky || LAYOUT.poSky;
    var puttStart = o.puttStart || {
      x: driveEnd.x,
      y: 0.04,
      z: driveEnd.z,
    };
    var hitT = puttPathHitsPO(puttStart, hole, po, 0.042);
    if (hitT == null || hitT < 0.15) hitT = 0.52;
    var bouncePoint = puttBallPosition(hitT, puttStart, hole);
    bouncePoint.y = 0.05;
    var inVel = {
      x: (hole.x - puttStart.x) * 0.85,
      y: 0,
      z: Math.max(0.8, (hole.z - puttStart.z) * 0.75),
    };
    var outVel = bounceOffPurchaseOrder(inVel, 0.58);
    var walkFrom = {
      x: puttStart.x + 0.55,
      y: 0,
      z: puttStart.z,
    };
    var walkTo = {
      x: po.x + 0.45,
      y: 0,
      z: po.z + 0.15,
    };
    var timings = Object.assign(
      {
        tee: 0.7,
        drive_swing: 1.55,
        drive_flight: 3.0,
        drive_land: 0.55,
        putt_setup: 0.9,
        po_fall: 1.35,
        putt_stroke: 0.75,
        putt_roll: 1.55,
        po_bounce: 0.4,
        miss_settle: 1.4,
        walk_to_po: 1.6,
        pickup_po: 1.1,
      },
      o.timings || {}
    );
    return {
      tee: tee,
      driveEnd: driveEnd,
      puttStart: puttStart,
      hole: hole,
      purchaseOrder: po,
      poSky: poSky,
      hitT: hitT,
      bouncePoint: bouncePoint,
      outVel: outVel,
      walkFrom: walkFrom,
      walkTo: walkTo,
      timings: timings,
      peakHeight: o.peakHeight != null ? o.peakHeight : 16,
    };
  }

  function phaseTimeline(timings) {
    var order = PHASES.slice(0, -1);
    var ends = {};
    var t = 0;
    for (var i = 0; i < order.length; i++) {
      t += timings[order[i]] || 0;
      ends[order[i]] = t;
    }
    ends.done = t;
    return ends;
  }

  function phaseAtTime(elapsed, config) {
    var cfg = config || createSequenceConfig();
    var ends = phaseTimeline(cfg.timings);
    var order = PHASES.slice(0, -1);
    var prev = 0;
    for (var i = 0; i < order.length; i++) {
      var name = order[i];
      if (elapsed < ends[name]) {
        var localT = (elapsed - prev) / (cfg.timings[name] || 1);
        return { phase: name, localT: clamp01(localT), ends: ends, prev: prev };
      }
      prev = ends[name];
    }
    return { phase: "done", localT: 1, ends: ends, prev: ends.done };
  }

  /**
   * Which audio cues should have fired by absolute elapsed time.
   * @returns {string[]} cue ids
   */
  function audioCuesFiredBy(elapsed, config) {
    var cfg = config || createSequenceConfig();
    var ends = phaseTimeline(cfg.timings);
    var fired = [];
    var prev = 0;
    for (var i = 0; i < PHASES.length - 1; i++) {
      var ph = PHASES[i];
      var end = ends[ph];
      var dur = cfg.timings[ph] || 0;
      for (var c = 0; c < AUDIO_CUES.length; c++) {
        var cue = AUDIO_CUES[c];
        if (cue.phase !== ph) continue;
        var cueTime = prev + cue.at * dur;
        if (elapsed + 1e-9 >= cueTime) fired.push(cue.id);
      }
      prev = end;
    }
    return fired;
  }

  /**
   * Absolute time of a named audio cue (for Web Audio scheduling).
   */
  function audioCueTime(cueId, config) {
    var cfg = config || createSequenceConfig();
    var ends = phaseTimeline(cfg.timings);
    var prev = 0;
    for (var i = 0; i < PHASES.length - 1; i++) {
      var ph = PHASES[i];
      var dur = cfg.timings[ph] || 0;
      for (var c = 0; c < AUDIO_CUES.length; c++) {
        if (AUDIO_CUES[c].id === cueId && AUDIO_CUES[c].phase === ph) {
          return prev + AUDIO_CUES[c].at * dur;
        }
      }
      prev = ends[ph];
    }
    return null;
  }

  function swingPose(u) {
    // Realistic-ish: takeaway → top → impact → follow
    var t = clamp01(u);
    var shoulder;
    var wrist;
    if (t < 0.35) {
      var a = t / 0.35;
      shoulder = lerp(0.15, -2.1, easeInOut(a));
      wrist = lerp(0, 0.4, a);
    } else if (t < 0.55) {
      var b = (t - 0.35) / 0.2;
      shoulder = lerp(-2.1, -2.35, easeInOut(b));
      wrist = 0.4;
    } else if (t < 0.72) {
      // Downswing to impact
      var c = (t - 0.55) / 0.17;
      shoulder = lerp(-2.35, 0.35, easeInQuad(c));
      wrist = lerp(0.4, -0.15, c);
    } else {
      var d = (t - 0.72) / 0.28;
      shoulder = lerp(0.35, 1.85, easeOutCubic(d));
      wrist = lerp(-0.15, -0.5, d);
    }
    return { shoulder: shoulder, wrist: wrist, weight: easeInOut(t) };
  }

  function sampleSimulation(elapsed, config) {
    var cfg = config || createSequenceConfig();
    var info = phaseAtTime(elapsed, cfg);
    var phase = info.phase;
    var u = info.localT;
    var ball = { x: cfg.tee.x, y: cfg.tee.y, z: cfg.tee.z };
    var hitPO = false;
    var poOnGround = false;
    var poHeld = false;
    var portalReady = false;
    var po = {
      x: cfg.poSky.x,
      y: cfg.poSky.y,
      z: cfg.poSky.z,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      visible: false,
    };
    var golfer = {
      swing: 0,
      putt: 0,
      onGreen: false,
      walk: 0,
      pickup: 0,
      pos: { x: 0.55, y: 0, z: 0.1 },
      facing: -0.35,
      shoulder: 0.15,
      wrist: 0,
    };

    var restPo = {
      x: cfg.purchaseOrder.x,
      y: cfg.purchaseOrder.y + 0.02,
      z: cfg.purchaseOrder.z,
      rotX: -0.12,
      rotY: 0.08,
      rotZ: 0,
    };

    if (phase === "tee") {
      ball = { x: cfg.tee.x, y: cfg.tee.y, z: cfg.tee.z };
      var sp0 = swingPose(0);
      golfer.shoulder = sp0.shoulder;
      golfer.wrist = sp0.wrist;
    } else if (phase === "drive_swing") {
      ball = { x: cfg.tee.x, y: cfg.tee.y, z: cfg.tee.z };
      golfer.swing = u;
      var sp = swingPose(u);
      golfer.shoulder = sp.shoulder;
      golfer.wrist = sp.wrist;
    } else if (phase === "drive_flight") {
      ball = driveBallPosition(u, cfg.tee, cfg.driveEnd, cfg.peakHeight);
      golfer.swing = 1;
      var spF = swingPose(1);
      golfer.shoulder = spF.shoulder;
      golfer.wrist = spF.wrist;
    } else if (phase === "drive_land") {
      ball = {
        x: cfg.driveEnd.x,
        y: cfg.driveEnd.y,
        z: cfg.driveEnd.z,
      };
      golfer.swing = 1;
    } else if (phase === "putt_setup") {
      ball = {
        x: cfg.puttStart.x,
        y: cfg.puttStart.y,
        z: cfg.puttStart.z,
      };
      golfer.onGreen = true;
      golfer.pos = {
        x: cfg.puttStart.x + 0.55,
        y: 0,
        z: cfg.puttStart.z,
      };
      golfer.facing = 0;
      golfer.shoulder = -0.35;
    } else if (phase === "po_fall") {
      ball = {
        x: cfg.puttStart.x,
        y: cfg.puttStart.y,
        z: cfg.puttStart.z,
      };
      golfer.onGreen = true;
      golfer.pos = {
        x: cfg.puttStart.x + 0.55,
        y: 0,
        z: cfg.puttStart.z,
      };
      golfer.facing = 0;
      po.visible = true;
      var fall = poFallPosition(u, cfg.poSky, restPo);
      po.x = fall.x;
      po.y = fall.y;
      po.z = fall.z;
      po.rotX = fall.rotX;
      po.rotY = fall.rotY;
      po.rotZ = fall.rotZ;
      if (u > 0.95) poOnGround = true;
    } else if (phase === "putt_stroke") {
      ball = {
        x: cfg.puttStart.x,
        y: cfg.puttStart.y,
        z: cfg.puttStart.z,
      };
      golfer.onGreen = true;
      golfer.putt = easeInOut(u);
      golfer.pos = {
        x: cfg.puttStart.x + 0.55,
        y: 0,
        z: cfg.puttStart.z,
      };
      golfer.facing = 0;
      golfer.shoulder = -0.4 + golfer.putt * 1.05;
      po.visible = true;
      poOnGround = true;
      po.x = restPo.x;
      po.y = restPo.y;
      po.z = restPo.z;
      po.rotX = restPo.rotX;
      po.rotY = restPo.rotY;
      po.rotZ = restPo.rotZ;
    } else if (phase === "putt_roll") {
      golfer.onGreen = true;
      golfer.putt = 1;
      golfer.pos = {
        x: cfg.puttStart.x + 0.55,
        y: 0,
        z: cfg.puttStart.z,
      };
      var rollT = u * cfg.hitT;
      ball = puttBallPosition(rollT, cfg.puttStart, cfg.hole);
      ball.y = cfg.puttStart.y;
      po.visible = true;
      poOnGround = true;
      po.x = restPo.x;
      po.y = restPo.y;
      po.z = restPo.z;
      po.rotX = restPo.rotX;
      po.rotY = restPo.rotY;
      po.rotZ = restPo.rotZ;
      if (u >= 0.97) hitPO = true;
    } else if (phase === "po_bounce") {
      golfer.onGreen = true;
      hitPO = true;
      poOnGround = true;
      po.visible = true;
      po.x = restPo.x;
      po.y = restPo.y + 0.02 * Math.sin(u * Math.PI);
      po.z = restPo.z;
      po.rotX = restPo.rotX;
      po.rotY = restPo.rotY;
      po.rotZ = restPo.rotZ + Math.sin(u * Math.PI * 4) * 0.08;
      ball = {
        x: cfg.bouncePoint.x,
        y: cfg.bouncePoint.y + 0.06 * Math.sin(u * Math.PI),
        z: cfg.bouncePoint.z,
      };
      golfer.pos = {
        x: cfg.puttStart.x + 0.55,
        y: 0,
        z: cfg.puttStart.z,
      };
    } else if (phase === "miss_settle") {
      golfer.onGreen = true;
      hitPO = true;
      poOnGround = true;
      po.visible = true;
      po.x = restPo.x;
      po.y = restPo.y;
      po.z = restPo.z;
      po.rotX = restPo.rotX;
      po.rotY = restPo.rotY;
      po.rotZ = restPo.rotZ;
      ball = settleAfterBounce(cfg.bouncePoint, cfg.outVel, u, 1.5);
      ball.y = Math.max(0.04, ball.y);
      golfer.pos = {
        x: cfg.puttStart.x + 0.55,
        y: 0,
        z: cfg.puttStart.z,
      };
    } else if (phase === "walk_to_po") {
      golfer.onGreen = true;
      hitPO = true;
      poOnGround = true;
      po.visible = true;
      po.x = restPo.x;
      po.y = restPo.y;
      po.z = restPo.z;
      po.rotX = restPo.rotX;
      po.rotY = restPo.rotY;
      po.rotZ = restPo.rotZ;
      ball = settleAfterBounce(cfg.bouncePoint, cfg.outVel, 1, 1.5);
      ball.y = 0.04;
      golfer.walk = easeInOut(u);
      golfer.pos = lerpVec(cfg.walkFrom, cfg.walkTo, golfer.walk);
      golfer.facing = Math.atan2(
        cfg.walkTo.x - cfg.walkFrom.x,
        cfg.walkTo.z - cfg.walkFrom.z
      );
      // Walk bob
      golfer.pos.y = Math.abs(Math.sin(u * Math.PI * 4)) * 0.03;
    } else if (phase === "pickup_po") {
      golfer.onGreen = true;
      hitPO = true;
      po.visible = true;
      ball = settleAfterBounce(cfg.bouncePoint, cfg.outVel, 1, 1.5);
      ball.y = 0.04;
      golfer.walk = 1;
      golfer.pickup = easeInOut(u);
      golfer.pos = { x: cfg.walkTo.x, y: 0, z: cfg.walkTo.z };
      golfer.facing = Math.atan2(
        restPo.x - cfg.walkTo.x,
        restPo.z - cfg.walkTo.z
      );
      golfer.shoulder = -0.2 - golfer.pickup * 0.9;
      // PO lifts into hand
      var hand = {
        x: golfer.pos.x - 0.15,
        y: 0.95 + golfer.pickup * 0.35,
        z: golfer.pos.z + 0.12,
      };
      po.x = lerp(restPo.x, hand.x, golfer.pickup);
      po.y = lerp(restPo.y, hand.y, golfer.pickup);
      po.z = lerp(restPo.z, hand.z, golfer.pickup);
      po.rotX = lerp(restPo.rotX, -1.1, golfer.pickup);
      po.rotY = lerp(restPo.rotY, 0.4, golfer.pickup);
      po.rotZ = lerp(restPo.rotZ, 0.2, golfer.pickup);
      if (u > 0.5) poHeld = true;
      if (u > 0.92) portalReady = true;
    } else {
      // done
      golfer.onGreen = true;
      hitPO = true;
      poHeld = true;
      portalReady = true;
      po.visible = true;
      ball = settleAfterBounce(cfg.bouncePoint, cfg.outVel, 1, 1.5);
      ball.y = 0.04;
      golfer.walk = 1;
      golfer.pickup = 1;
      golfer.pos = { x: cfg.walkTo.x, y: 0, z: cfg.walkTo.z };
      golfer.shoulder = -1.1;
      po.x = golfer.pos.x - 0.15;
      po.y = 1.3;
      po.z = golfer.pos.z + 0.12;
      po.rotX = -1.1;
      po.rotY = 0.4;
      po.rotZ = 0.2;
    }

    var inHole = isInHole(ball, cfg.hole, LAYOUT.holeRadius);
    if (hitPO) inHole = false;

    return {
      phase: phase,
      localT: u,
      ball: ball,
      po: po,
      hitPO: hitPO,
      poOnGround: poOnGround,
      poHeld: poHeld,
      portalReady: portalReady,
      inHole: inHole,
      golfer: golfer,
      bouncePoint: cfg.bouncePoint,
      driveEnd: cfg.driveEnd,
      hole: cfg.hole,
      purchaseOrder: cfg.purchaseOrder,
      totalDuration: info.ends.done,
      audioCues: audioCuesFiredBy(elapsed, cfg),
    };
  }

  function nextPhase(phase) {
    var idx = PHASE_INDEX[phase];
    if (idx == null || idx >= PHASES.length - 1) return "done";
    return PHASES[idx + 1];
  }

  function lankyProportions() {
    return {
      totalHeight: 2.18,
      torsoHeight: 0.52,
      legLength: 1.08,
      armLength: 0.88,
      shoulderWidth: 0.36,
      hipWidth: 0.3,
      headRadius: 0.115,
    };
  }

  return {
    PHASES: PHASES,
    AUDIO_CUES: AUDIO_CUES,
    LAYOUT: LAYOUT,
    driveBallPosition: driveBallPosition,
    defaultDriveLanding: defaultDriveLanding,
    puttBallPosition: puttBallPosition,
    poFallPosition: poFallPosition,
    purchaseOrderBounds: purchaseOrderBounds,
    intersectsPurchaseOrder: intersectsPurchaseOrder,
    puttPathHitsPO: puttPathHitsPO,
    bounceOffPurchaseOrder: bounceOffPurchaseOrder,
    settleAfterBounce: settleAfterBounce,
    isInHole: isInHole,
    createSequenceConfig: createSequenceConfig,
    phaseTimeline: phaseTimeline,
    phaseAtTime: phaseAtTime,
    sampleSimulation: sampleSimulation,
    audioCuesFiredBy: audioCuesFiredBy,
    audioCueTime: audioCueTime,
    swingPose: swingPose,
    nextPhase: nextPhase,
    clamp01: clamp01,
    easeInOut: easeInOut,
    lankyProportions: lankyProportions,
  };
});
