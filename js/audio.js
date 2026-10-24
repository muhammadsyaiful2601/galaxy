window.app = window.app || {};

// ============================================================================
// WEB AUDIO API - SPACE EXPLORER SOUND SYSTEM
// ============================================================================

window.app.audio = {
  ctx: null,
  masterGain: null,
  muted: false,
  volume: 0.6,
  initialized: false,

  // Nodes
  droneOsc: null,
  droneGain: null,
  droneLFO: null,
  droneLFoGain: null,

  warpOsc: null,
  warpGain: null,
  warpNoise: null,
  warpNoiseBuf: null,

  clickOsc: null,
  clickGain: null,

  // Engine nodes
  engineOsc: null,
  engineGain: null,

  // MP3 Audio elements
  ambientAudio: null,
  warpAudio: null,
  reconAudio: null,
  heavyAudio: null,
  ufoAudio: null,

  // State
  dronePlaying: false,
  warpPlaying: false,
  enginePlaying: false,
  shipSoundPlaying: null,
  ambientNormalVolume: 0.5,
  ambientEngineVolume: 0.15,

  init: function () {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    this.initialized = true;
    this.createDrone();
    this.createWarpBuffers();
    this.createClickNodes();
    this.createEngineNodes();

    // Resume context on first user interaction
    const resume = () => {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('keydown', resume);
    };
    document.addEventListener('pointerdown', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  },

  // ---------- Ambient space drone ----------
  createDrone: function () {
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'triangle';
    this.droneOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.droneLFO = this.ctx.createOscillator();
    this.droneLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime);
    this.droneLFoGain = this.ctx.createGain();
    this.droneLFoGain.gain.setValueAtTime(3, this.ctx.currentTime);
    this.droneLFO.connect(this.droneLFoGain);
    this.droneLFoGain.connect(this.droneOsc.frequency);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc.start();
    this.droneLFO.start();
  },

  startDrone: function () {
    if (!this.initialized) this.init();
    if (this.dronePlaying || this.muted) return;
    this.droneGain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 2.5);
    this.dronePlaying = true;
  },

  stopDrone: function () {
    if (!this.dronePlaying) return;
    this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);
    this.dronePlaying = false;
  },

  // ---------- MP3 Ambient (background space sound) ----------

  initAmbient: function () {
    if (this.ambientAudio) return;
    this.ambientAudio = new Audio('sound/ambient-sound.mp3');
    this.ambientAudio.loop = true;
    this.ambientAudio.volume = this.volume * this.ambientNormalVolume;
    this.ambientAudio.play().catch(e => {
      document.addEventListener('pointerdown', () => this.ambientAudio.play().catch(() => {}), { once: true });
      document.addEventListener('keydown', () => this.ambientAudio.play().catch(() => {}), { once: true });
    });
  },

  stopAmbient: function () {
    if (this.ambientAudio) {
      this.ambientAudio.pause();
      this.ambientAudio.currentTime = 0;
    }
  },

  // ---------- MP3 Warp sound ----------

  playWarpFile: function () {
    if (this.muted) return;
    if (!this.warpAudio) {
      this.warpAudio = new Audio('sound/warping.mp3');
      this.warpAudio.volume = this.volume * 0.7;
    }
    this.warpAudio.currentTime = 0;
    this.warpAudio.play().catch(e => console.log('Warp MP3 play failed:', e));
  },

  stopWarpFile: function () {
    if (this.warpAudio) {
      this.warpAudio.pause();
      this.warpAudio.currentTime = 0;
    }
  },

  // ---------- MP3 Spaceship sounds ----------

  playShipSound: function (shipType) {
    if (this.muted) return;

    // Jika sudah sedang memutar ship type yang sama, jangan memutar ulang
    if (this.shipSoundPlaying === shipType) return;

    // Stop sound kapal sebelumnya jika ada
    this.stopShipSound();

    let audioEl;
    switch (shipType) {
      case 'recon':
        if (!this.reconAudio) {
          this.reconAudio = new Audio('sound/recon sound.mp3');
          this.reconAudio.loop = true;
          this.reconAudio.volume = this.volume * 0.6;
        }
        audioEl = this.reconAudio;
        break;
      case 'heavy':
        if (!this.heavyAudio) {
          this.heavyAudio = new Audio('sound/heavy sound.mp3');
          this.heavyAudio.loop = true;
          this.heavyAudio.volume = this.volume * 0.6;
        }
        audioEl = this.heavyAudio;
        break;
      case 'ufo':
        if (!this.ufoAudio) {
          this.ufoAudio = new Audio('sound/ufo sound.mp3');
          this.ufoAudio.loop = true;
          this.ufoAudio.volume = this.volume * 0.6;
        }
        audioEl = this.ufoAudio;
        break;
      default:
        return;
    }

    audioEl.currentTime = 0;
    audioEl.play().catch(e => console.log('Ship sound play failed (' + shipType + '):', e));
    this.shipSoundPlaying = shipType;
  },

  stopShipSound: function () {
    if (this.shipSoundPlaying) {
      const prevType = this.shipSoundPlaying;
      const prevAudio = this.shipSoundPlaying === 'recon' ? this.reconAudio
        : this.shipSoundPlaying === 'heavy' ? this.heavyAudio
        : this.ufoAudio;
      if (prevAudio) {
        prevAudio.pause();
        prevAudio.currentTime = 0;
      }
      this.shipSoundPlaying = null;
    }
  },

  // ---------- Warp sound ----------
  createWarpBuffers: function () {
    const bufferSize = this.ctx.sampleRate * 2.5;
    this.warpNoiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.warpNoiseBuf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  },

  playWarp: function (duration = 3) {
    if (!this.initialized) this.init();
    if (this.muted) return;

    if (this.warpOsc) {
      try { this.warpOsc.stop(); } catch (e) {}
      try { this.warpNoise.stop(); } catch (e) {}
    }

    this.warpPlaying = true;

    this.warpOsc = this.ctx.createOscillator();
    this.warpOsc.type = 'sawtooth';
    this.warpOsc.frequency.setValueAtTime(60, this.ctx.currentTime);
    this.warpOsc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + duration);

    this.warpGain = this.ctx.createGain();
    this.warpGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.warpGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.3);
    this.warpGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    this.warpOsc.connect(this.warpGain);
    this.warpGain.connect(this.masterGain);

    this.warpNoise = this.ctx.createBufferSource();
    this.warpNoise.buffer = this.warpNoiseBuf;
    this.warpNoise.loop = false;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.2);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(4000, this.ctx.currentTime + duration);
    noiseFilter.Q.setValueAtTime(1, this.ctx.currentTime);

    this.warpNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    this.warpOsc.start();
    this.warpNoise.start();

    setTimeout(() => {
      this.warpPlaying = false;
      try { this.warpOsc.stop(); } catch (e) {}
      try { this.warpNoise.stop(); } catch (e) {}
    }, duration * 1000 + 300);
  },

  // ---------- UI Click sounds ----------
  createClickNodes: function () {
    this.clickOsc = this.ctx.createOscillator();
    this.clickOsc.type = 'sine';
    this.clickGain = this.ctx.createGain();
    this.clickGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.clickOsc.connect(this.clickGain);
    this.clickGain.connect(this.masterGain);
    this.clickOsc.start();
  },

  playClick: function (type = 'ui') {
    if (!this.initialized) this.init();
    if (this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'ship') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    } else if (type === 'view') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(950, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    } else if (type === 'warp-btn') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    } else if (type === 'lock') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  },

  // ---------- Engine hum (WASD movement) ----------

  createEngineNodes: function () {
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.engineOsc.start();
  },

  playEngine: function (active) {
    if (!this.initialized) this.init();
    if (this.muted) return;

    if (active && !this.enginePlaying) {
      this.engineGain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.1);
      this.enginePlaying = true;
      // Kurangi volume ambient saat engine aktif agar suara mesin lebih terdengar
      if (this.ambientAudio) {
        this.ambientAudio.volume = this.volume * this.ambientEngineVolume;
      }
    } else if (!active && this.enginePlaying) {
      this.engineGain.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 0.2);
      this.enginePlaying = false;
      // Kembalikan volume ambient normal saat engine mati
      if (this.ambientAudio) {
        this.ambientAudio.volume = this.volume * this.ambientNormalVolume;
      }
    }
  },

  // ---------- Volume / Mute ----------
  setVolume: function (v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : this.volume;
    // Gunakan ambientNormalVolume sebagai baseline (jika engine aktif, playEngine akan override)
    if (this.ambientAudio) this.ambientAudio.volume = this.muted ? 0 : this.volume * this.ambientNormalVolume;
    if (this.warpAudio) this.warpAudio.volume = this.muted ? 0 : this.volume * 0.7;
    if (this.reconAudio) this.reconAudio.volume = this.muted ? 0 : this.volume * 0.6;
    if (this.heavyAudio) this.heavyAudio.volume = this.muted ? 0 : this.volume * 0.6;
    if (this.ufoAudio) this.ufoAudio.volume = this.muted ? 0 : this.volume * 0.6;
  },

  toggleMute: function () {
    if (!this.initialized) this.init();
    this.muted = !this.muted;
    if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : this.volume;
    if (this.ambientAudio) this.ambientAudio.volume = this.muted ? 0 : this.volume * this.ambientNormalVolume;
    if (this.warpAudio) this.warpAudio.volume = this.muted ? 0 : this.volume * 0.7;
    if (this.reconAudio) this.reconAudio.volume = this.muted ? 0 : this.volume * 0.6;
    if (this.heavyAudio) this.heavyAudio.volume = this.muted ? 0 : this.volume * 0.6;
    if (this.ufoAudio) this.ufoAudio.volume = this.muted ? 0 : this.volume * 0.6;
    return this.muted;
  },

  setMuted: function (muted) {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : this.volume;
    if (this.ambientAudio) this.ambientAudio.volume = muted ? 0 : this.volume * this.ambientNormalVolume;
    if (this.warpAudio) this.warpAudio.volume = muted ? 0 : this.volume * 0.7;
    if (this.reconAudio) this.reconAudio.volume = muted ? 0 : this.volume * 0.6;
    if (this.heavyAudio) this.heavyAudio.volume = muted ? 0 : this.volume * 0.6;
    if (this.ufoAudio) this.ufoAudio.volume = muted ? 0 : this.volume * 0.6;
  }
};
