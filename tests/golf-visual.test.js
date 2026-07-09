/**
 * Unit tests for GolfVisual pure helpers.
 * Run: node tests/golf-visual.test.js
 */
"use strict";

var path = require("path");
var assert = require("assert");
var V = require(path.join(__dirname, "..", "js", "golf", "visual.js"));
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

test("material specs include layered surfaces with roughness", function () {
  var fairway = V.materialSpec("fairway");
  var ball = V.materialSpec("ball");
  var po = V.materialSpec("poPaper");
  assert.ok(fairway.procedural);
  assert.ok(fairway.roughness > 0.5);
  assert.ok(ball.procedural === "ball-dimples");
  assert.ok(po.roughness < 0.5);
});

test("scene quality flags require shadows and atmosphere", function () {
  var q = V.sceneQualityFlags();
  assert.strictEqual(q.shadowMapping, true);
  assert.strictEqual(q.directionalLightShadows, true);
  assert.strictEqual(q.atmosphericFog, true);
  assert.ok(q.proceduralTextures.length >= 5);
});

test("camera lerp varies by phase for cinematic easing", function () {
  assert.ok(V.cameraLerpForPhase("drive_flight") < V.cameraLerpForPhase("po_bounce"));
  assert.ok(V.cameraLerpForPhase("tee") > 0);
});

test("golfer pose channels respond to swing and walk samples", function () {
  var cfg = P.createSequenceConfig();
  var swing = P.sampleSimulation(P.phaseTimeline(cfg.timings).drive_swing * 0.5, cfg);
  var poseSwing = V.golferPoseChannels(swing);
  assert.ok(Math.abs(poseSwing.hip) > 0.1);

  var walk = P.sampleSimulation(P.phaseTimeline(cfg.timings).walk_to_po - 0.2, cfg);
  var poseWalk = V.golferPoseChannels(walk);
  assert.ok(poseWalk.kneeL >= 0 || poseWalk.kneeR >= 0);
});

console.log("");
console.log(passed + " tests passed");
if (process.exitCode) process.exit(process.exitCode);