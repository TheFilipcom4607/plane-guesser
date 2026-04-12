window.SoundManager = (function () {
  let ctx = null;
  let enabled = false;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function play(name) {
    if (!enabled) return;
    try {
      const c = getCtx();
      const t = c.currentTime;
      switch (name) {
        case "correct": playCorrect(c, t); break;
        case "wrong": playWrong(c, t); break;
        case "milestone": playMilestone(c, t); break;
        case "gameEndGood": playGameEndGood(c, t); break;
        case "gameEndBad": playGameEndBad(c, t); break;
      }
    } catch (_) {}
  }

  function tone(c, type, freq, freqEnd, gainVal, start, duration) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, start + duration);
    gain.gain.setValueAtTime(gainVal, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration);
  }

  function playCorrect(c, t) {
    tone(c, "sine", 600, 900, 0.25, t, 0.18);
  }

  function playWrong(c, t) {
    tone(c, "sawtooth", 150, 100, 0.15, t, 0.28);
  }

  function playMilestone(c, t) {
    tone(c, "sine", 523, 523, 0.2, t, 0.12);
    tone(c, "sine", 784, 784, 0.2, t + 0.14, 0.16);
  }

  function playGameEndGood(c, t) {
    tone(c, "sine", 523, 523, 0.2, t, 0.1);
    tone(c, "sine", 659, 659, 0.2, t + 0.12, 0.1);
    tone(c, "sine", 784, 784, 0.25, t + 0.24, 0.2);
  }

  function playGameEndBad(c, t) {
    tone(c, "sawtooth", 400, 400, 0.15, t, 0.2);
    tone(c, "sawtooth", 300, 250, 0.15, t + 0.25, 0.3);
  }

  function setEnabled(val) {
    enabled = val;
    localStorage.setItem("planeguessrSound", val ? "on" : "off");
  }

  function init() {
    enabled = localStorage.getItem("planeguessrSound") === "on";
  }

  return {
    play: play,
    setEnabled: setEnabled,
    init: init,
    isEnabled: function () { return enabled; }
  };
})();
