/**
 * Web Audio cues timed to GolfPhysics events (procedural, no asset files).
 * Also exposes pure schedule helpers for unit tests (no AudioContext required).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GolfAudio = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var CUE_IDS = [
    "whoosh",
    "impact",
    "land",
    "putt_tap",
    "po_flutter",
    "po_land",
    "po_bounce",
    "pickup",
  ];

  /**
   * Pure: build absolute schedule of cue ids from a physics module + config.
   * Used by tests and by createGolfAudio schedule recording.
   * @param {object} Physics GolfPhysics export
   * @param {object} [config] sequence config
   * @returns {{ id: string, time: number, phase: string }[]}
   */
  function buildEventSchedule(Physics, config) {
    if (!Physics || !Physics.AUDIO_CUES || !Physics.audioCueTime) {
      return [];
    }
    var cfg = config || (Physics.createSequenceConfig
      ? Physics.createSequenceConfig()
      : null);
    var out = [];
    for (var i = 0; i < Physics.AUDIO_CUES.length; i++) {
      var cue = Physics.AUDIO_CUES[i];
      var t = Physics.audioCueTime(cue.id, cfg);
      if (t != null) {
        out.push({ id: cue.id, time: t, phase: cue.phase, at: cue.at });
      }
    }
    out.sort(function (a, b) {
      return a.time - b.time;
    });
    return out;
  }

  /**
   * Pure: which cues fire when advancing from prevElapsed → elapsed (exclusive of already fired).
   * Mirrors playCue once-per-id semantics against sample.audioCues.
   */
  function cuesNewlyFired(prevCues, nextCues) {
    var prev = prevCues || [];
    var next = nextCues || [];
    var seen = {};
    var i;
    for (i = 0; i < prev.length; i++) seen[prev[i]] = true;
    var fresh = [];
    for (i = 0; i < next.length; i++) {
      if (!seen[next[i]]) {
        fresh.push(next[i]);
        seen[next[i]] = true;
      }
    }
    return fresh;
  }

  /**
   * Drive the shipped wiring path: for each sample.audioCues id, record schedule
   * entry once (same once-fired set as createGolfAudio).
   * @returns {{ id: string, simTime: number }[]}
   */
  function recordScheduleFromSamples(samples) {
    var fired = {};
    var log = [];
    for (var s = 0; s < samples.length; s++) {
      var sample = samples[s];
      if (!sample || !sample.audioCues) continue;
      var simT = sample.elapsed != null ? sample.elapsed : s;
      for (var i = 0; i < sample.audioCues.length; i++) {
        var id = sample.audioCues[i];
        if (fired[id]) continue;
        fired[id] = true;
        log.push({ id: id, simTime: simT });
      }
    }
    return log;
  }

  function createGolfAudio(options) {
    var opts = options || {};
    var ctx = null;
    var master = null;
    var muted = false;
    var fired = {};
    var unlocked = !!opts.autoUnlock;
    var scheduleLog = opts.scheduleLog || null;
    var clock = typeof opts.now === "function" ? opts.now : null;
    var silent = !!opts.silent;

    function ensure() {
      if (silent) return null;
      if (ctx) return ctx;
      var g =
        typeof globalThis !== "undefined"
          ? globalThis
          : typeof window !== "undefined"
            ? window
            : null;
      if (!g) return null;
      var AC = g.AudioContext || g.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
      return ctx;
    }

    function unlock() {
      unlocked = true;
      var c = ensure();
      if (!c) return;
      if (c.state === "suspended") {
        c.resume();
      }
    }

    function setMuted(m) {
      muted = !!m;
      if (master) master.gain.value = muted ? 0 : 0.35;
    }

    function tone(freq, type, t0, dur, gain, freqEnd) {
      if (!ctx || muted) return;
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      if (freqEnd != null) {
        o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
      }
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain || 0.2, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(master);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    }

    function noiseBurst(t0, dur, gain, filterFreq) {
      if (!ctx || muted) return;
      var n = Math.floor(ctx.sampleRate * dur);
      var buf = ctx.createBuffer(1, n, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < n; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      }
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var filt = ctx.createBiquadFilter();
      filt.type = "bandpass";
      filt.frequency.value = filterFreq || 1200;
      filt.Q.value = 0.7;
      var g = ctx.createGain();
      g.gain.setValueAtTime(gain || 0.25, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filt);
      filt.connect(g);
      g.connect(master);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    var PLAYERS = {
      whoosh: function (t0) {
        noiseBurst(t0, 0.22, 0.2, 900);
        tone(180, "triangle", t0, 0.18, 0.08, 90);
      },
      impact: function (t0) {
        noiseBurst(t0, 0.08, 0.45, 2200);
        tone(140, "square", t0, 0.06, 0.15, 60);
      },
      land: function (t0) {
        noiseBurst(t0, 0.12, 0.18, 600);
        tone(90, "sine", t0, 0.15, 0.1, 50);
      },
      putt_tap: function (t0) {
        tone(220, "triangle", t0, 0.05, 0.12, 100);
        noiseBurst(t0, 0.04, 0.12, 1800);
      },
      po_flutter: function (t0) {
        noiseBurst(t0, 0.4, 0.1, 2400);
        tone(400, "sine", t0, 0.25, 0.04, 200);
      },
      po_land: function (t0) {
        noiseBurst(t0, 0.1, 0.14, 800);
        tone(160, "triangle", t0, 0.12, 0.08, 70);
      },
      po_bounce: function (t0) {
        tone(320, "square", t0, 0.07, 0.14, 90);
        noiseBurst(t0, 0.09, 0.22, 1500);
      },
      pickup: function (t0) {
        tone(480, "sine", t0, 0.12, 0.1, 720);
        noiseBurst(t0, 0.08, 0.08, 3000);
      },
    };

    function playCue(id, simTime) {
      if (fired[id] || muted) return false;
      if (!PLAYERS[id] && CUE_IDS.indexOf(id) === -1) return false;
      // Silent / headless path still records once unlocked.
      if (!unlocked && !silent) return false;
      fired[id] = true;
      var when = clock ? clock() : 0;
      if (scheduleLog) {
        scheduleLog.push({
          id: id,
          audioTime: when,
          simTime: simTime != null ? simTime : null,
        });
      }
      if (silent) return true;
      var c = ensure();
      if (!c) return true;
      if (c.state === "suspended") c.resume();
      var fn = PLAYERS[id];
      if (fn) fn(c.currentTime + 0.01);
      return true;
    }

    /**
     * Sync fired set to simulation sample.audioCues list.
     */
    function syncFromSample(sample) {
      if (!sample || !sample.audioCues) return;
      var simT = sample.elapsed;
      for (var i = 0; i < sample.audioCues.length; i++) {
        playCue(sample.audioCues[i], simT);
      }
    }

    function reset() {
      fired = {};
      if (scheduleLog && scheduleLog.length) scheduleLog.length = 0;
    }

    function getScheduleLog() {
      return scheduleLog ? scheduleLog.slice() : [];
    }

    return {
      unlock: unlock,
      setMuted: setMuted,
      playCue: playCue,
      syncFromSample: syncFromSample,
      reset: reset,
      getScheduleLog: getScheduleLog,
      isMuted: function () {
        return muted;
      },
      isUnlocked: function () {
        return unlocked;
      },
    };
  }

  return {
    createGolfAudio: createGolfAudio,
    buildEventSchedule: buildEventSchedule,
    cuesNewlyFired: cuesNewlyFired,
    recordScheduleFromSamples: recordScheduleFromSamples,
    CUE_IDS: CUE_IDS,
  };
});
