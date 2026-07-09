/**
 * Pure visual quality helpers — testable without WebGL.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    var path = require("path");
    var Physics = require(path.join(__dirname, "physics.js"));
    module.exports = factory(Physics);
  } else {
    root.GolfVisual = factory(typeof GolfPhysics !== "undefined" ? GolfPhysics : null);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (Physics) {
  "use strict";

  var P = Physics;

  var MATERIAL_SPECS = {
    fairway: { roughness: 0.84, metalness: 0.03, procedural: "fairway-stripes" },
    rough: { roughness: 0.95, metalness: 0.0, procedural: "rough-noise" },
    green: { roughness: 0.62, metalness: 0.02, procedural: "green-fine" },
    fringe: { roughness: 0.78, metalness: 0.02, procedural: "fringe" },
    ball: { roughness: 0.38, metalness: 0.04, procedural: "ball-dimples" },
    skin: { roughness: 0.68, metalness: 0.02, procedural: null },
    poPaper: { roughness: 0.42, metalness: 0.0, procedural: "purchase-order" },
    clubMetal: { roughness: 0.22, metalness: 0.88, procedural: null },
  };

  var SCENE_QUALITY = {
    shadowMapping: true,
    directionalLightShadows: true,
    softShadowMap: true,
    atmosphericFog: true,
    skyDome: true,
    proceduralTextures: [
      "fairway-stripes",
      "rough-noise",
      "green-fine",
      "ball-dimples",
      "purchase-order",
      "sky-gradient",
    ],
  };

  function materialSpec(name) {
    return MATERIAL_SPECS[name] || null;
  }

  function allMaterialSpecs() {
    return Object.assign({}, MATERIAL_SPECS);
  }

  function sceneQualityFlags() {
    return Object.assign({}, SCENE_QUALITY);
  }

  function cameraLerpForPhase(phase) {
    var map = {
      tee: 0.1,
      drive_swing: 0.11,
      drive_flight: 0.07,
      drive_land: 0.09,
      putt_setup: 0.1,
      po_fall: 0.13,
      putt_stroke: 0.11,
      putt_roll: 0.1,
      po_bounce: 0.16,
      miss_settle: 0.1,
      walk_to_po: 0.09,
      pickup_po: 0.1,
      done: 0.08,
    };
    return map[phase] != null ? map[phase] : 0.1;
  }

  function golferPoseChannels(sample) {
    var g = sample && sample.golfer ? sample.golfer : {};
    var phase = sample ? sample.phase : "tee";
    var swing = g.swing || 0;
    var putt = g.putt || 0;
    var walk = g.walk || 0;
    var pickup = g.pickup || 0;
    var hip = 0;
    var torsoLean = 0;
    var kneeL = 0;
    var kneeR = 0;
    var armSwing = 0;

    if (phase === "drive_swing" || phase === "drive_flight") {
      hip = (P ? P.easeInOut(swing) : swing) * 0.55;
      torsoLean = -0.08 + swing * 0.12;
      kneeR = swing * 0.22;
      kneeL = -swing * 0.08;
      armSwing = g.shoulder || 0;
    } else if (phase === "putt_stroke" || phase === "putt_roll") {
      torsoLean = -0.14 - putt * 0.06;
      hip = putt * 0.08;
      kneeL = 0.12;
      kneeR = 0.12;
    } else if (phase === "walk_to_po") {
      var step = Math.sin(walk * Math.PI * 4);
      kneeL = Math.max(0, step) * 0.42;
      kneeR = Math.max(0, -step) * 0.42;
      armSwing = step * 0.35;
      torsoLean = -0.04;
    } else if (phase === "pickup_po" || phase === "done") {
      torsoLean = -0.22 - pickup * 0.25;
      kneeL = 0.28;
      kneeR = 0.28;
      hip = pickup * 0.12;
    }

    return {
      hip: hip,
      torsoLean: torsoLean,
      kneeL: kneeL,
      kneeR: kneeR,
      armSwing: armSwing,
    };
  }

  return {
    MATERIAL_SPECS: MATERIAL_SPECS,
    SCENE_QUALITY: SCENE_QUALITY,
    materialSpec: materialSpec,
    allMaterialSpecs: allMaterialSpecs,
    sceneQualityFlags: sceneQualityFlags,
    cameraLerpForPhase: cameraLerpForPhase,
    golferPoseChannels: golferPoseChannels,
  };
});