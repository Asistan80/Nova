// Prosedürel ses: dosya yok, hepsi WebAudio ile üretilir.
export class Sound {
  constructor() { this.ctx = null; this.vol = { master: .8, music: .5, sfx: .9 }; this.on = true; }
  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx; this.master = c.createGain(); this.master.connect(c.destination);
    this.musicG = c.createGain(); this.musicG.connect(this.master); this.sfxG = c.createGain(); this.sfxG.connect(this.master); this.ambG = c.createGain(); this.ambG.connect(this.master);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; this.noiseBuf = nb;
    const mk = (type, f, q) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 1; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.ambG); s.start(); return { g, fl }; };
    this.wind = mk("lowpass", 420, .7); this.rainN = mk("highpass", 2200, .4); this.water = mk("bandpass", 1500, .6);
    this.pad = []; [196, 246.9, 293.7, 392].forEach((f, i) => { const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f; const g = c.createGain(); g.gain.value = .0; const lfo = c.createOscillator(); lfo.frequency.value = .08 + i * .03; const lg = c.createGain(); lg.gain.value = .02; lfo.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(this.musicG); o.start(); lfo.start(); this.pad.push(g); });
    this.apply(); this.chirpT = 0; this.cricketT = 0;
  }
  apply() { if (!this.ctx) return; const t = this.ctx.currentTime; this.master.gain.setTargetAtTime(this.on ? this.vol.master : 0, t, .05); this.musicG.gain.setTargetAtTime(this.vol.music, t, .1); this.sfxG.gain.setTargetAtTime(this.vol.sfx, t, .05); this.pad.forEach((g, i) => g.gain.setTargetAtTime(.035, t, 2)); }
  tone(f, d, type = "sine", v = .18, when = 0, slide = 0) { if (!this.ctx || !this.on) return; const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(this.sfxG); o.start(t); o.stop(t + d + .05); }
  noise(d, f, v = .1) { if (!this.ctx || !this.on) return; const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf; const fl = c.createBiquadFilter(); fl.type = "bandpass"; fl.frequency.value = f; const g = c.createGain(); g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d); s.connect(fl); fl.connect(g); g.connect(this.sfxG); s.start(); s.stop(c.currentTime + d); }
  step(run) { this.noise(.07, 300 + Math.random() * 200, run ? .09 : .06); }
  blip() { this.tone(660, .06, "triangle", .1); }
  talk() { this.tone(300 + Math.random() * 200, .05, "square", .04); }
  pickup() { this.tone(660, .1, "sine", .2); this.tone(990, .16, "sine", .2, .08); }
  heart() { this.tone(523, .12, "sine", .18); this.tone(784, .2, "sine", .18, .1); this.tone(1047, .25, "sine", .14, .2); }
  quest() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, .22, "triangle", .2, i * .11)); }
  shard() { [392, 523, 659, 784, 988, 1319].forEach((f, i) => this.tone(f, .5, "sine", .15, i * .09)); }
  setRain(v) { if (!this.ctx) return; this.rainN.g.gain.setTargetAtTime(v * .09, this.ctx.currentTime, .6); }
  thunder() { this.noise(1.6, 120, .35); this.tone(60, 1.4, "sawtooth", .12, 0, -30); }
  firework() { this.noise(.5, 900, .14); this.tone(420, .5, "sine", .08, 0, -300); }
  bad() { this.tone(180, .2, "sawtooth", .1); }
  finale() { [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 2.2, "sine", .14, i * .35)); }
  // her karede çağrılır: sis, gündüz/gece ve göle yakınlık ile ortam sesi
  ambient(dt, night, sis, pondDist, moving) {
    if (!this.ctx || !this.on) return; const t = this.ctx.currentTime;
    this.wind.g.gain.setTargetAtTime(.05 + sis * .1 + (moving ? .01 : 0), t, .5); this.wind.fl.frequency.setTargetAtTime(300 + sis * 300, t, 1);
    this.water.g.gain.setTargetAtTime(Math.max(0, 1 - pondDist / 28) * .06, t, .3);
    this.chirpT -= dt; this.cricketT -= dt;
    if (night < .35 && this.chirpT <= 0) { this.chirpT = 1.5 + Math.random() * 4; const f = 2200 + Math.random() * 1500; this.tone(f, .09, "sine", .045, 0, 600); this.tone(f * 1.1, .08, "sine", .04, .1, -300); }
    if (night > .5 && this.cricketT <= 0) { this.cricketT = .45 + Math.random() * .5; for (let i = 0; i < 3; i++) this.tone(4300, .03, "square", .012, i * .06); }
  }
}
