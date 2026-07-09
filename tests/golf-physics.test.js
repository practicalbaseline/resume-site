/**
 * Unit tests for shipped GolfPhysics (js/golf/physics.js).
 * Run: node tests/golf-physics.test.js
 */
"use strict";

var path = require("path");
var assert = require("assert");
var P = require(path.join(__dirname, "..", "js", "golf", "physics.js"));

var passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("ok - " + name);
  } catch (err) {
    console.error("not ok - " + name);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

test("PHASES include drive, po_fall, bounce, walk, pickup", function () {
  var need = [
    "drive_flight",
    "po_fall",
    "putt_roll",
    "po_bounce",
    "walk_to_po",
    "pickup_po",
    "done",
  ];
  need.forEach(function (n) {
    assert.ok(P.PHASES.indexOf(n) !== -1, n);
  });
  assert.ok(P.PHASES.indexOf("po_fall") < P.PHASES.indexOf("putt_roll"));
  assert.ok(P.PHASES.indexOf("po_bounce") < P.PHASES.indexOf("walk_to_po"));
  assert.ok(P.PHASES.indexOf("pickup_po") < P.PHASES.indexOf("done"));
  assert.strictEqual(P.nextPhase("pickup_po"), "done");
});

test("driveBallPosition arcs and ends toward green (projectile-style)", function () {
  var start = P.LAYOUT.tee;
  var end = P.defaultDriveLanding();
  var t0 = P.driveBallPosition(0, start, end, 16);
  var mid = P.driveBallPosition(0.42, start, end, 16);
  var late = P.driveBallPosition(0.85, start, end, 16);
  var fin = P.driveBallPosition(1, start, end, 16);
  assert.ok(Math.abs(t0.y - start.y) < 0.2, "starts near ground");
  assert.ok(mid.y > start.y + 5, "high apex");
  assert.ok(late.y < mid.y, "descending after apex");
  assert.ok(fin.z > mid.z, "advances downrange with time");
  assert.ok(fin.z > 40, "far down fairway");
  assert.ok(Math.abs(fin.x) < 2, "not side miss");
  assert.ok(Math.abs(fin.z - P.LAYOUT.greenCenter.z) < 6);
  // Monotonic range progress mid-flight
  assert.ok(mid.z > t0.z);
});

test("poFallPosition drops from sky to rest", function () {
  var sky = P.LAYOUT.poSky;
  var rest = {
    x: P.LAYOUT.purchaseOrder.x,
    y: 0.05,
    z: P.LAYOUT.purchaseOrder.z,
  };
  var start = P.poFallPosition(0, sky, rest);
  var end = P.poFallPosition(1, sky, rest);
  assert.ok(start.y > 10);
  assert.ok(end.y < 1);
  assert.ok(Math.abs(end.z - rest.z) < 0.5);
});

test("green putt without PO reaches cup on line", function () {
  var start = { x: 0.1, y: 0.04, z: 47.0 };
  var hole = P.LAYOUT.hole;
  // PO far off the line
  var farPo = {
    x: 8,
    y: 0.03,
    z: 50,
    width: 0.5,
    height: 0.03,
    depth: 0.4,
  };
  assert.strictEqual(
    P.puttPathHitsPO(start, hole, farPo, 0.042),
    null,
    "no intercept off-line"
  );
  var fin = P.puttBallPosition(1, start, hole);
  assert.ok(P.isInHole(fin, hole), "full putt enters cup");
  // Stays on line (straight interpolation)
  var mid = P.puttBallPosition(0.5, start, hole);
  var expectedX = start.x + (hole.x - start.x) * P.easeInOut
    ? start.x + (hole.x - start.x) * (1 - Math.pow(1 - 0.5, 3))
    : mid.x;
  // easeOutCubic at 0.5
  var s = 1 - Math.pow(0.5, 3);
  assert.ok(Math.abs(mid.x - (start.x + (hole.x - start.x) * s)) < 1e-9);
  assert.ok(Math.abs(mid.z - (start.z + (hole.z - start.z) * s)) < 1e-9);
  void expectedX;
});

test("putt path intersects PO; bounce misses hole", function () {
  var cfg = P.createSequenceConfig();
  var hitT = P.puttPathHitsPO(cfg.puttStart, cfg.hole, cfg.purchaseOrder, 0.042);
  assert.ok(hitT != null && hitT > 0 && hitT < 1);
  var atHit = P.puttBallPosition(hitT, cfg.puttStart, cfg.hole);
  assert.ok(P.intersectsPurchaseOrder(atHit, cfg.purchaseOrder, 0.042));
  // Without bounce, continuing putt would reach cup
  var pureEnd = P.puttBallPosition(1, cfg.puttStart, cfg.hole);
  assert.ok(P.isInHole(pureEnd, cfg.hole), "on-line putt would hole out");
  var out = P.bounceOffPurchaseOrder({ x: 0, y: 0, z: 1.4 }, 0.58);
  assert.ok(out.z < 0, "deflects reverse-ish");
  var settle = P.settleAfterBounce(cfg.bouncePoint, cfg.outVel, 1, 1.5);
  assert.strictEqual(P.isInHole(settle, cfg.hole), false);
  // Sim after bounce: never in hole
  var after = P.sampleSimulation(
    P.phaseTimeline(cfg.timings).miss_settle,
    cfg
  );
  assert.ok(after.hitPO);
  assert.strictEqual(after.inHole, false);
});

test("sampleSimulation: flight → po fall → bounce → pickup portal", function () {
  var cfg = P.createSequenceConfig();
  var ends = P.phaseTimeline(cfg.timings);

  var flight = P.sampleSimulation(
    ends.drive_swing + cfg.timings.drive_flight * 0.4,
    cfg
  );
  assert.strictEqual(flight.phase, "drive_flight");
  assert.ok(flight.ball.y > 2);
  assert.ok(flight.ball.z > 5);

  var fall = P.sampleSimulation(ends.po_fall - 0.05, cfg);
  assert.strictEqual(fall.phase, "po_fall");
  assert.ok(fall.po.visible);
  assert.ok(fall.po.y < cfg.poSky.y);

  var bounce = P.sampleSimulation(ends.po_bounce - 0.01, cfg);
  assert.strictEqual(bounce.phase, "po_bounce");
  assert.ok(bounce.hitPO);

  var walk = P.sampleSimulation(ends.walk_to_po - 0.05, cfg);
  assert.strictEqual(walk.phase, "walk_to_po");
  assert.ok(walk.golfer.walk > 0.5);

  var pick = P.sampleSimulation(ends.pickup_po - 0.02, cfg);
  assert.strictEqual(pick.phase, "pickup_po");
  assert.ok(pick.poHeld || pick.golfer.pickup > 0.4);

  var done = P.sampleSimulation(ends.done + 0.1, cfg);
  assert.strictEqual(done.phase, "done");
  assert.ok(done.portalReady);
  assert.ok(done.poHeld);
  assert.strictEqual(done.inHole, false);
});

test("phase order matches gag sequence; Replay returns to tee", function () {
  var cfg = P.createSequenceConfig();
  var ends = P.phaseTimeline(cfg.timings);
  var expected = P.PHASES.slice(0, -1);
  var prevEnd = 0;
  for (var i = 0; i < expected.length; i++) {
    var name = expected[i];
    var mid = prevEnd + (cfg.timings[name] || 0) * 0.5;
    var info = P.phaseAtTime(mid, cfg);
    assert.strictEqual(info.phase, name, "mid " + name);
    prevEnd = ends[name];
  }
  // Replay: t=0 is tee
  var restart = P.sampleSimulation(0, cfg);
  assert.strictEqual(restart.phase, "tee");
  assert.strictEqual(restart.portalReady, false);
  assert.strictEqual(restart.hitPO, false);
  assert.strictEqual(restart.po.visible, false);
});

test("determinism: same elapsed + config → identical sample", function () {
  var cfg = P.createSequenceConfig();
  var times = [0, 1.2, 4.5, 8.1, 11.0, 14.5];
  for (var i = 0; i < times.length; i++) {
    var a = P.sampleSimulation(times[i], cfg);
    var b = P.sampleSimulation(times[i], cfg);
    assert.strictEqual(a.phase, b.phase);
    assert.strictEqual(a.ball.x, b.ball.x);
    assert.strictEqual(a.ball.y, b.ball.y);
    assert.strictEqual(a.ball.z, b.ball.z);
    assert.strictEqual(a.po.x, b.po.x);
    assert.strictEqual(a.po.y, b.po.y);
    assert.strictEqual(a.hitPO, b.hitPO);
    assert.deepStrictEqual(a.audioCues, b.audioCues);
  }
});

test("audio cues schedule whoosh before impact before land", function () {
  var cfg = P.createSequenceConfig();
  var whoosh = P.audioCueTime("whoosh", cfg);
  var impact = P.audioCueTime("impact", cfg);
  var land = P.audioCueTime("land", cfg);
  var bounce = P.audioCueTime("po_bounce", cfg);
  var pickup = P.audioCueTime("pickup", cfg);
  assert.ok(whoosh != null && impact != null && land != null);
  assert.ok(whoosh < impact);
  assert.ok(impact < land);
  assert.ok(bounce > land);
  assert.ok(pickup > bounce);

  var midFlight = P.audioCuesFiredBy(impact + 0.01, cfg);
  assert.ok(midFlight.indexOf("whoosh") !== -1);
  assert.ok(midFlight.indexOf("impact") !== -1);
  assert.ok(midFlight.indexOf("land") === -1);
});

test("swingPose moves through backswing to follow-through", function () {
  var a = P.swingPose(0.2);
  var b = P.swingPose(0.6);
  var c = P.swingPose(0.95);
  assert.ok(a.shoulder < 0, "backswing");
  assert.ok(c.shoulder > b.shoulder || c.shoulder > 0, "follow through");
});

test("lanky proportions tall and narrow", function () {
  var L = P.lankyProportions();
  assert.ok(L.totalHeight > 2.0);
  assert.ok(L.legLength > L.torsoHeight);
  assert.ok(L.shoulderWidth < L.totalHeight * 0.25);
});

console.log("");
console.log(passed + " tests passed");
if (process.exitCode) process.exit(process.exitCode);
