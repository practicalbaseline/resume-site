/**
 * Structure tests for golf.html and scene.js shipped artifacts.
 * Run: node tests/golf-structure.test.js
 */
"use strict";

var fs = require("fs");
var path = require("path");
var assert = require("assert");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "golf.html"), "utf8");
var scene = fs.readFileSync(path.join(ROOT, "js", "golf", "scene.js"), "utf8");

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

test("golf.html loads classic script chain including visual and scene", function () {
  [
    "js/golf/three.min.js",
    "js/golf/physics.js",
    "js/golf/visual.js",
    "js/golf/scene.js",
    "css/golf.css",
    "data-golf-canvas",
    "Fairway Theater",
  ].forEach(function (token) {
    assert.ok(html.indexOf(token) !== -1, token);
  });
});

test("golf.html includes file protocol serve hint", function () {
  assert.ok(html.indexOf("data-file-hint") !== -1);
  assert.ok(html.indexOf("http.server") !== -1);
});

test("scene.js enables shadow mapping and directional shadows", function () {
  assert.ok(/shadowMap\.enabled\s*=\s*true/.test(scene));
  assert.ok(/castShadow\s*=\s*true/.test(scene));
  assert.ok(/DirectionalLight/.test(scene));
  assert.ok(/PCFSoftShadowMap/.test(scene));
});

test("scene.js uses procedural textures and atmosphere", function () {
  assert.ok(/makeGrassTexture|makeRoughTexture|makeBallTexture/.test(scene));
  assert.ok(/makeSkyTexture|buildSky/.test(scene));
  assert.ok(/scene\.fog|Fog\(/.test(scene));
  assert.ok(/CanvasTexture/.test(scene));
  assert.ok(/MeshStandardMaterial/.test(scene));
});

test("scene.js wires GolfVisual pose and camera helpers", function () {
  assert.ok(/GolfVisual|golferPoseChannels|cameraLerpForPhase/.test(scene));
});

console.log("");
console.log(passed + " tests passed");
if (process.exitCode) process.exit(process.exitCode);