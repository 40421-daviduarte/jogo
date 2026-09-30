/**
 * audio.js - Sistema de Áudio Procedural 100% Nativo (Web Audio API)
 * Gera todos os efeitos sonoros (SFX) e trilha sonora ambiente sintetizada em tempo real,
 * sem requisições de rede ou arquivos externos.
 */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentBiome = 'forest';
    this.musicInterval = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbientMusic();
    } catch (e) {
      console.warn('Web Audio API não suportada ou bloqueada:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.enabled ? 0.5 : 0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // --- Efeitos Sonoros Procedurais ---

  playJump() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playAttack() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Swoosh de ataque (ruído branco filtrado com sweep)
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    filter.Q.setValueAtTime(2, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
  }

  playHit() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playSlam() {
    // Impacto sísmico do Gorila
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  playDash() {
    // Dash veloz do Guepardo
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playTransform() {
    // Som mágico de transformação totêmica (Acorde arpejado místico)
    if (!this.enabled || !this.ctx) return;
    const notes = [329.63, 392.00, 493.88, 587.33, 659.25, 783.99]; // E maior pentatônica
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.35);
    });
  }

  playDig() {
    // Som de escavação do Tamanduá
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playBlock() {
    // Som de bloqueio de escudo / deflexão mística
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Impacto metálico agudo
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(680, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.16);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Ressonância mística de energia totêmica
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1020, now);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.22);
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(now);
    osc2.stop(now + 0.22);
  }

  playSplash() {
    // Entrada/Mergulho na água (Tubarão)
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playChest() {
    // Fanfarra ao abrir baú ou libertar Totem
    if (!this.enabled || !this.ctx) return;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.5);
    });
  }

  playBossRoar() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.0);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  // --- Música Ambiente e Temas Procedurais ---

  setBiome(biome) {
    if (this.currentBiome !== biome) {
      this.currentBiome = biome;
    }
  }

  startAmbientMusic() {
    if (this.musicInterval) clearInterval(this.musicInterval);

    // Escalas pentatônicas atmosféricas por bioma
    const scales = {
      forest: [220, 261.63, 293.66, 329.63, 392, 440], // Lá menor natural
      caves: [110, 130.81, 146.83, 164.81, 196, 220],  // Caverna profunda
      swamp: [174.61, 207.65, 233.08, 261.63, 311.13], // Frígio misterioso
      canyon: [293.66, 329.63, 369.99, 440, 493.88],  // Ventoso / Dórico
      ruins: [130.81, 155.56, 174.61, 196.00, 233.08], // Ruínas antigas
      boss: [98.0, 116.54, 130.81, 146.83, 164.81]     // Tensão de chefe
    };

    let step = 0;
    this.musicInterval = setInterval(() => {
      if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;

      const scale = scales[this.currentBiome] || scales.forest;
      const isBoss = this.currentBiome === 'boss';

      // Nota de baixo (Drone contínuo suave)
      if (step % 8 === 0) {
        this.playAtmospherePad(scale[0] / 2, isBoss ? 2.5 : 4.0, isBoss ? 0.25 : 0.15);
      }

      // Melodia espaçada mística
      if (Math.random() > (isBoss ? 0.2 : 0.45)) {
        const note = scale[Math.floor(Math.random() * scale.length)];
        this.playMelodicNote(note, isBoss ? 0.4 : 1.2, isBoss ? 0.2 : 0.12);
      }

      // Batida rítmica suave para áreas de tensão e chefe
      if (isBoss && step % 2 === 0) {
        this.playBassPulse();
      }

      step++;
    }, 700);
  }

  playAtmospherePad(freq, duration, volume) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + duration * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playMelodicNote(freq, duration, volume) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playBassPulse() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// Instância global de áudio
const soundSystem = new SoundSystem();
