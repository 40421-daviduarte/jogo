/**
 * game.js - Controlador Principal do Jogo, Loop 60FPS, UI, Câmera e Entrada
 * Integra áudio, mundo, entidades e renderização em um Metroidvania fluido e completo.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Canvas do Minimapa e Mapa Completo
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.fullMapCanvas = document.getElementById('full-map-canvas');
    this.fullMapCtx = this.fullMapCanvas.getContext('2d');

    // Resolução Interna Fixa do Jogo (16:9)
    this.width = ROOM_WIDTH;   // 800
    this.height = ROOM_HEIGHT; // 480
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Estado do Loop
    this.lastTime = 0;
    this.isRunning = false;
    this.isPaused = false;
    this.dialogueActive = false;

    // Gerenciamento de Entradas
    this.input = {
      keys: {},
      touchLeft: false,
      touchRight: false,
      touchJump: false,
      touchAtk: false,
      touchSpc: false
    };

    // Câmera & Efeitos
    this.camera = { x: 0, y: 0, shakeX: 0, shakeY: 0, shakeTimer: 0, shakeMag: 0 };
    this.particles = [];
    this.floatingTexts = [];
    this.shockwaves = [];

    // Instanciação dos Módulos Centrais
    this.world = new World();
    this.player = new Player(100, 360);

    // Configuração dos Eventos e Elementos da DOM
    this.setupEventListeners();
    this.setupTouchControls();
    this.renderFormsBar();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Marca a sala inicial como visitada
    this.world.visitedRooms.add(this.world.getRoomKey(0, 0));
    this.spawnRoomEntities();
  }

  resizeCanvas() {
    const scale = Math.min(window.innerWidth / this.width, window.innerHeight / this.height) * 0.96;
    this.canvas.style.width = `${Math.floor(this.width * scale)}px`;
    this.canvas.style.height = `${Math.floor(this.height * scale)}px`;
  }

  // --- Inicialização e Entradas (Input Handling) ---

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;

      // Inicia o contexto de áudio na primeira tecla caso ainda não tenha sido iniciado
      soundSystem.init();
      soundSystem.resume();

      // Troca Rápida de Formas pelas teclas 1 a 6
      const formKeys = {
        Digit1: 'human',
        Digit2: 'mouse',
        Digit3: 'gorilla',
        Digit4: 'cheetah',
        Digit5: 'shark',
        Digit6: 'anteater'
      };
      if (formKeys[e.code]) {
        this.player.transform(formKeys[e.code]);
      }

      // Tecla de Ataque Básico: [J] ou [Z]
      if (e.code === 'KeyJ' || e.code === 'KeyZ') {
        if (!this.dialogueActive && !this.isPaused) {
          this.player.attack();
        }
      }

      // Tecla de Habilidade Especial: [L] ou [X]
      if (e.code === 'KeyL' || e.code === 'KeyX') {
        if (!this.dialogueActive && !this.isPaused) {
          this.player.specialAction();
        }
      }

      // Teclas de Defesa (Bloqueio com Escudo Totêmico): [K], [V], [Shift]
      if (e.code === 'KeyK' || e.code === 'KeyV' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!this.dialogueActive && !this.isPaused) {
          this.player.startDefend();
        }
      }

      // Tecla de Escavação com o Tamanduá: [B]
      if (e.code === 'KeyB') {
        if (!this.dialogueActive && !this.isPaused) {
          this.player.digAction();
        }
      }

      // Tecla de Interação / Avançar Diálogo: [E], [C] ou [Space]
      if (e.code === 'KeyE' || e.code === 'KeyC') {
        if (this.dialogueActive) {
          this.advanceDialogue();
        } else {
          this.handleInteraction();
        }
      }

      // Alternar Roda de Formas [Q]
      if (e.code === 'KeyQ') {
        this.cycleNextForm();
      }

      // Abrir/Fechar Mapa Completo: [M]
      if (e.code === 'KeyM') {
        this.toggleMapModal();
      }

      // Pausar: [P] ou [Escape]
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;

      // Soltar botão de Defesa
      if (e.code === 'KeyK' || e.code === 'KeyV' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.player.stopDefend();
      }
    });

    // Botão de Defesa no HUD (Mouse e Touch)
    const hudDefBtn = document.getElementById('hud-defend-btn');
    if (hudDefBtn) {
      hudDefBtn.addEventListener('mousedown', () => this.player.startDefend());
      hudDefBtn.addEventListener('mouseup', () => this.player.stopDefend());
      hudDefBtn.addEventListener('mouseleave', () => this.player.stopDefend());
      hudDefBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.player.startDefend(); });
      hudDefBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.player.stopDefend(); });
    }

    // Botões da Interface
    document.getElementById('start-btn').addEventListener('click', () => {
      soundSystem.init();
      soundSystem.resume();
      document.getElementById('start-screen').classList.add('hidden');
      this.start();
    });

    document.getElementById('guide-btn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('minimap-container').addEventListener('click', () => {
      this.toggleMapModal();
    });

    document.getElementById('close-map-btn').addEventListener('click', () => {
      this.toggleMapModal();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('toggle-sound-btn').addEventListener('click', (e) => {
      const enabled = soundSystem.toggleSound();
      e.target.innerText = `Som: ${enabled ? 'LIGADO' : 'MUTADO'}`;
    });

    document.getElementById('reset-game-btn').addEventListener('click', () => {
      localStorage.removeItem('totem_shifter_save');
      location.reload();
    });
  }

  setupTouchControls() {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile) {
      document.getElementById('touch-controls').classList.remove('hidden');
    }

    const bindTouch = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(); });
      el.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); });
    };

    bindTouch('touch-left', () => this.input.touchLeft = true, () => this.input.touchLeft = false);
    bindTouch('touch-right', () => this.input.touchRight = true, () => this.input.touchRight = false);
    bindTouch('touch-jmp', () => this.input.touchJump = true, () => this.input.touchJump = false);
    bindTouch('touch-atk', () => this.player.attack(), () => {});
    bindTouch('touch-def', () => this.player.startDefend(), () => this.player.stopDefend());
    bindTouch('touch-spc', () => this.player.specialAction(), () => {});
    bindTouch('touch-dig', () => this.player.digAction(), () => {});
    bindTouch('touch-form', () => this.cycleNextForm(), () => {});
  }

  cycleNextForm() {
    const formList = ['human', 'mouse', 'gorilla', 'cheetah', 'shark', 'anteater'];
    const unlocked = formList.filter(f => this.player.unlockedForms.has(f));
    const curIdx = unlocked.indexOf(this.player.form);
    const nextForm = unlocked[(curIdx + 1) % unlocked.length];
    this.player.transform(nextForm);
  }

  // --- Gerenciamento de Salas e Entidades ---

  changeRoom(newRx, newRy) {
    const key = this.world.getRoomKey(newRx, newRy);
    const room = this.world.rooms.get(key);
    if (!room) return;

    this.world.currentRoomX = newRx;
    this.world.currentRoomY = newRy;
    this.world.visitedRooms.add(key);

    // Atualiza Bioma e Música Ambiente
    soundSystem.setBiome(room.boss && room.activeBoss ? 'boss' : room.biome);
    document.getElementById('current-biome-text').innerText = BIOMES[room.biome].name;

    this.spawnRoomEntities();
    this.updateHUD();

    // Mensagem de lore inicial ao entrar em certas salas
    if (room.lore && !room.loreRead) {
      room.loreRead = true;
      this.showDialogue('Voz dos Ancestrais', room.lore, '🌿');
    }
  }

  spawnRoomEntities() {
    const room = this.world.getCurrentRoom();
    if (!room) return;

    // Spawna inimigos da sala
    room.enemies = [];
    room.enemiesData.forEach(data => {
      room.enemies.push(new Enemy(data));
    });

    // Spawna chefe se ainda não derrotado
    if (room.boss && !room.bossDefeated) {
      room.activeBoss = new Boss(room.boss);
      this.showBossHUD(room.activeBoss);
    } else {
      room.activeBoss = null;
      this.hideBossHUD();
    }
  }

  // --- Interações (Altares, Baús, Checkpoints, Lore) ---

  handleInteraction() {
    const room = this.world.getCurrentRoom();
    if (!room) return;

    // 1. Altar de Totem Ancestral
    if (room.totem && !this.world.unlockedTotems.has(room.totem.form)) {
      const tx = room.totem.x * TILE_SIZE;
      const ty = room.totem.y * TILE_SIZE;
      if (Math.hypot(this.player.x - tx, this.player.y - ty) < 48) {
        this.unlockTotem(room.totem.form, room.totem.name);
        return;
      }
    }

    // 2. Baú de Tesouro
    if (room.chest && !this.world.openedChests.has(room.chest.id)) {
      const cx = room.chest.x * TILE_SIZE;
      const cy = room.chest.y * TILE_SIZE;
      if (Math.hypot(this.player.x - cx, this.player.y - cy) < 48) {
        this.world.openedChests.add(room.chest.id);
        soundSystem.playChest();

        if (room.chest.reward === 'max_hp') {
          this.player.maxHp += room.chest.amount;
          this.player.hp = this.player.maxHp;
          this.showToastBanner('RECOMPENSA ANCESTRAL!', `Vida Máxima aumentada em +${room.chest.amount} HP!`);
        } else {
          this.player.relics += room.chest.amount;
          this.showToastBanner('BAÚ ABERTO!', `Você encontrou ${room.chest.amount} Gemas Totêmicas!`);
        }
        this.saveProgress();
        this.updateHUD();
        return;
      }
    }

    // 3. Fogueira / Checkpoint de Restauração
    if (room.checkpoint) {
      const chx = room.checkpoint.x * TILE_SIZE;
      const chy = room.checkpoint.y * TILE_SIZE;
      if (Math.hypot(this.player.x - chx, this.player.y - chy) < 48) {
        this.player.hp = this.player.maxHp;
        this.player.stamina = this.player.maxStamina;
        soundSystem.playTransform();
        this.showFloatingText(this.player.x, this.player.y - 14, 'TOTALMENTE RESTAURADO & SALVO!', '#2ecc71');
        this.saveProgress();
        this.updateHUD();
        return;
      }
    }

    // 4. Monólito de Lore
    if (room.loreStone) {
      const lx = room.loreStone.x * TILE_SIZE;
      const ly = room.loreStone.y * TILE_SIZE;
      if (Math.hypot(this.player.x - lx, this.player.y - ly) < 48) {
        this.showDialogue('Inscrição Ancestral', room.loreStone.text, '📜');
      }
    }
  }

  unlockTotem(formKey, totemName) {
    this.world.unlockedTotems.add(formKey);
    this.player.unlockedForms.add(formKey);
    soundSystem.playChest();

    this.showToastBanner('FORMA DESPERTADA!', `Você obteve a transformação: ${FORM_STATS[formKey].name}!`);
    this.showDialogue(
      'Espírito Animal',
      `"A essência primordial agora reside em você. Use minhas habilidades para desvendar caminhos e restaurar o equilíbrio do mundo!"`,
      FORM_STATS[formKey].icon
    );

    this.renderFormsBar();
    this.saveProgress();
  }

  onEnemyDefeated(enemy) {
    soundSystem.playHit();
    this.addParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 14, '#2ed573');
    this.player.relics += 5;
    this.updateHUD();
  }

  onBossDefeated(boss) {
    soundSystem.playChest();
    this.triggerCameraShake(14, 0.6);
    this.addParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 40, '#f1c40f');

    const room = this.world.getCurrentRoom();
    if (room) {
      room.bossDefeated = true;
      room.activeBoss = null;
    }
    this.hideBossHUD();

    if (boss.rewardTotem) {
      this.unlockTotem(boss.rewardTotem, FORM_STATS[boss.rewardTotem].name);
    }

    if (boss.isFinalBoss) {
      this.showToastBanner('O EQUILÍBRIO FOI RESTAURADO!', 'Parabéns, Kael! Você purificou o mundo e dominou todas as formas ancestrais!');
      this.showDialogue(
        'Voz da Criação',
        '"A corrupção do Vazio se dissipou. Graças à sua coragem e à união dos seis espíritos totêmicos, a terra floresce em paz mais uma vez."',
        '👑'
      );
    }
  }

  onPlayerDeath() {
    this.showFloatingText(this.player.x, this.player.y, 'DERROTADO...', '#e74c3c');
    setTimeout(() => {
      // Renasce na sala (0,0) com vida restaurada
      this.player.hp = this.player.maxHp;
      this.player.stamina = this.player.maxStamina;
      this.changeRoom(0, 0);
      this.player.x = 100;
      this.player.y = 360;
      this.updateHUD();
    }, 1200);
  }

  // --- Sistema de Interface e Diálogos ---

  showDialogue(speaker, text, portrait = '🐾') {
    this.dialogueActive = true;
    const box = document.getElementById('dialogue-box');
    document.getElementById('dialogue-speaker').innerText = speaker;
    document.getElementById('dialogue-text').innerText = text;
    document.getElementById('dialogue-portrait').innerText = portrait;
    box.classList.remove('hidden');
  }

  advanceDialogue() {
    this.dialogueActive = false;
    document.getElementById('dialogue-box').classList.add('hidden');
  }

  showToastBanner(title, desc) {
    const banner = document.getElementById('toast-banner');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-desc').innerText = desc;
    banner.classList.remove('hidden');
    setTimeout(() => {
      banner.classList.add('hidden');
    }, 3500);
  }

  showBossHUD(boss) {
    const bossHud = document.getElementById('boss-hud');
    document.getElementById('boss-name').innerText = boss.name;
    this.updateBossHUD(boss);
    bossHud.classList.remove('hidden');
  }

  updateBossHUD(boss) {
    const percent = Math.max(0, (boss.hp / boss.maxHp) * 100);
    document.getElementById('boss-hp-bar').style.width = `${percent}%`;
    document.getElementById('boss-phase-text').innerText = `Fase ${boss.phase} - ${Math.round(percent)}%`;
  }

  hideBossHUD() {
    document.getElementById('boss-hud').classList.add('hidden');
  }

  renderFormsBar() {
    const container = document.getElementById('forms-bar');
    container.innerHTML = '';

    const forms = ['human', 'mouse', 'gorilla', 'cheetah', 'shark', 'anteater'];
    forms.forEach((formKey, index) => {
      const stats = FORM_STATS[formKey];
      const isUnlocked = this.player.unlockedForms.has(formKey);
      const isActive = this.player.form === formKey;

      const slot = document.createElement('div');
      slot.className = `form-slot ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      slot.title = `${stats.name}: ${stats.desc}`;
      slot.innerHTML = `
        <span>${isUnlocked ? stats.icon : '🔒'}</span>
        <span class="form-slot-key">${index + 1}</span>
      `;

      if (isUnlocked) {
        slot.addEventListener('click', () => {
          this.player.transform(formKey);
        });
      }

      container.appendChild(slot);
    });

    document.getElementById('player-avatar').innerText = FORM_STATS[this.player.form].icon;
  }

  updateHUD() {
    // Vida e Stamina
    const hpPercent = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
    const staPercent = Math.max(0, (this.player.stamina / this.player.maxStamina) * 100);

    document.getElementById('hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('hp-text').innerText = `${Math.round(this.player.hp)} / ${this.player.maxHp}`;

    document.getElementById('stamina-bar').style.width = `${staPercent}%`;
    document.getElementById('stamina-text').innerText = `${Math.round(this.player.stamina)} / ${this.player.maxStamina}`;

    // Relíquias
    document.getElementById('relic-count').innerText = this.player.relics;

    // Atualiza ícone ativo nas formas
    this.renderFormsBar();
    this.renderMinimap();
  }

  // --- Renderização do Minimapa e Mapa Completo ---

  renderMinimap() {
    const mCtx = this.minimapCtx;
    mCtx.clearRect(0, 0, 120, 90);

    const cellW = 16;
    const cellH = 12;
    const offsetX = 50;
    const offsetY = 35;

    this.world.rooms.forEach((room, key) => {
      if (this.world.visitedRooms.has(key)) {
        const dx = offsetX + room.x * (cellW + 2);
        const dy = offsetY + room.y * (cellH + 2);

        mCtx.fillStyle = '#2c3e50';
        mCtx.fillRect(dx, dy, cellW, cellH);

        // Se for a sala atual do jogador
        if (room.x === this.world.currentRoomX && room.y === this.world.currentRoomY) {
          mCtx.fillStyle = '#00cec9';
          mCtx.fillRect(dx + 3, dy + 2, cellW - 6, cellH - 4);
        } else if (room.boss && !room.bossDefeated) {
          mCtx.fillStyle = '#e74c3c';
          mCtx.fillRect(dx + 5, dy + 3, 6, 6);
        } else if (room.totem && !this.world.unlockedTotems.has(room.totem.form)) {
          mCtx.fillStyle = '#f1c40f';
          mCtx.fillRect(dx + 5, dy + 3, 6, 6);
        }
      }
    });
  }

  renderFullMap() {
    const fCtx = this.fullMapCtx;
    fCtx.clearRect(0, 0, 700, 460);

    const cellW = 56;
    const cellH = 38;
    const offsetX = 300;
    const offsetY = 180;

    this.world.rooms.forEach((room, key) => {
      const dx = offsetX + room.x * (cellW + 6);
      const dy = offsetY + room.y * (cellH + 6);

      if (this.world.visitedRooms.has(key)) {
        // Sala Visitada
        fCtx.fillStyle = '#1e293b';
        fCtx.fillRect(dx, dy, cellW, cellH);
        fCtx.strokeStyle = '#475569';
        fCtx.strokeRect(dx, dy, cellW, cellH);

        // Sala Atual
        if (room.x === this.world.currentRoomX && room.y === this.world.currentRoomY) {
          fCtx.strokeStyle = '#00cec9';
          fCtx.lineWidth = 3;
          fCtx.strokeRect(dx + 2, dy + 2, cellW - 4, cellH - 4);
          fCtx.fillStyle = '#00cec9';
          fCtx.font = 'bold 11px sans-serif';
          fCtx.fillText('VOCÊ', dx + 12, dy + 22);
        } else if (room.boss && !room.bossDefeated) {
          fCtx.fillStyle = '#e74c3c';
          fCtx.font = 'bold 12px sans-serif';
          fCtx.fillText('💀 CHEFE', dx + 4, dy + 22);
        } else if (room.totem && !this.world.unlockedTotems.has(room.totem.form)) {
          fCtx.fillStyle = '#f1c40f';
          fCtx.font = 'bold 11px sans-serif';
          fCtx.fillText('✨ TOTEM', dx + 4, dy + 22);
        } else if (room.chest && !this.world.openedChests.has(room.chest.id)) {
          fCtx.fillStyle = '#a29bfe';
          fCtx.font = 'bold 11px sans-serif';
          fCtx.fillText('📦 BAÚ', dx + 10, dy + 22);
        }
      }
    });
  }

  toggleMapModal() {
    const modal = document.getElementById('map-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
      this.renderFullMap();
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const modal = document.getElementById('pause-modal');
    if (this.isPaused) {
      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  // --- Efeitos Visuais (Partículas, Textos e Tremores) ---

  triggerCameraShake(magnitude, duration) {
    this.camera.shakeMag = magnitude;
    this.camera.shakeTimer = duration;
  }

  addParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: Math.random() * 3 + 2,
        color: color,
        alpha: 1.0,
        life: 0.4 + Math.random() * 0.3
      });
    }
  }

  addShieldSparks(x, y) {
    for (let i = 0; i < 18; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.5;
      const speed = Math.random() * 6 + 3;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 2,
        color: Math.random() > 0.5 ? '#00d2d3' : (Math.random() > 0.3 ? '#f1c40f' : '#ffffff'),
        alpha: 1.0,
        life: 0.35 + Math.random() * 0.25
      });
    }
  }

  addWaterSpray(x, y) {
    for (let i = 0; i < 14; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.4;
      const speed = Math.random() * 4 + 2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        color: Math.random() > 0.4 ? '#00d2d3' : (Math.random() > 0.2 ? '#74b9ff' : '#ffffff'),
        alpha: 0.9,
        life: 0.4 + Math.random() * 0.2
      });
    }
  }

  showFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      vy: -1.2,
      alpha: 1.0,
      life: 0.8
    });
  }

  addShockwave(x, y) {
    this.shockwaves.push({
      x: x,
      y: y,
      radius: 6,
      maxRadius: 65,
      alpha: 0.9
    });
  }

  // --- Persistência de Dados (Save/Load) ---

  saveProgress() {
    const data = {
      unlockedForms: Array.from(this.player.unlockedForms),
      unlockedTotems: Array.from(this.world.unlockedTotems),
      openedChests: Array.from(this.world.openedChests),
      visitedRooms: Array.from(this.world.visitedRooms),
      relics: this.player.relics,
      maxHp: this.player.maxHp,
      currentRoomX: this.world.currentRoomX,
      currentRoomY: this.world.currentRoomY
    };
    try {
      localStorage.setItem('totem_shifter_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Falha ao salvar progresso no localStorage:', e);
    }
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('totem_shifter_save');
      if (saved) {
        const data = JSON.parse(saved);
        this.player.unlockedForms = new Set(data.unlockedForms);
        this.world.unlockedTotems = new Set(data.unlockedTotems);
        this.world.openedChests = new Set(data.openedChests);
        this.world.visitedRooms = new Set(data.visitedRooms);
        this.player.relics = data.relics || 0;
        this.player.maxHp = data.maxHp || 100;
        this.player.hp = this.player.maxHp;
        this.changeRoom(data.currentRoomX || 0, data.currentRoomY || 0);
        this.updateHUD();
      }
    } catch (e) {
      console.warn('Falha ao carregar progresso:', e);
    }
  }

  // --- Utilitários de Colisão ---

  checkOverlap(r1, r2) {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  // --- Game Loop Principal (60 FPS) ---

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loadProgress();
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Cap em 50ms para evitar saltos
    this.lastTime = currentTime;

    if (!this.isPaused && !this.dialogueActive) {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // 1. Atualiza Jogador
    this.player.update(this.input, this.world, dt);

    const room = this.world.getCurrentRoom();
    if (room) {
      // 2. Atualiza Inimigos
      room.enemies.forEach(enemy => enemy.update(this.player, dt));

      // 3. Atualiza Chefe Ativo
      if (room.activeBoss) {
        room.activeBoss.update(this.player, dt);
      }

      // 4. Pisos que desmoronam ao pisar (Guepardo)
      for (let i = this.world.crumblingTiles.length - 1; i >= 0; i--) {
        const ct = this.world.crumblingTiles[i];
        ct.timer -= dt;
        if (ct.timer <= 0) {
          if (room.grid[ct.r] && room.grid[ct.r][ct.c] === TILE.CRUMBLING) {
            room.grid[ct.r][ct.c] = TILE.EMPTY;
            soundSystem.playHit();
            this.addParticles(ct.c * TILE_SIZE + 16, ct.r * TILE_SIZE + 8, 10, '#e67e22');
          }
          this.world.crumblingTiles.splice(i, 1);
        }
      }
    }

    // 5. Atualiza Efeitos (Partículas, Tremores, Textos)
    if (this.camera.shakeTimer > 0) {
      this.camera.shakeTimer -= dt;
      this.camera.shakeX = (Math.random() - 0.5) * this.camera.shakeMag;
      this.camera.shakeY = (Math.random() - 0.5) * this.camera.shakeMag;
    } else {
      this.camera.shakeX = 0;
      this.camera.shakeY = 0;
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= dt / ft.life;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 240 * dt;
      sw.alpha -= 1.8 * dt;
      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) this.shockwaves.splice(i, 1);
    }

    // Atualiza HUD a cada frame
    this.updateHUD();
  }

  render() {
    this.ctx.save();
    this.ctx.translate(this.camera.shakeX, this.camera.shakeY);

    // 1. Desenha o Mundo e Tiles do Bioma
    this.world.draw(this.ctx, this.camera);

    // 2. Desenha Inimigos
    const room = this.world.getCurrentRoom();
    if (room) {
      room.enemies.forEach(e => spriteRenderer.drawEnemy(this.ctx, e));

      // 3. Desenha Chefe
      if (room.activeBoss) {
        spriteRenderer.drawBoss(this.ctx, room.activeBoss);
      }
    }

    // 4. Desenha o Protagonista na Forma Atual
    spriteRenderer.drawPlayer(this.ctx, this.player);

    // 5. Ondas de Choque (Ground Slam do Gorila)
    this.shockwaves.forEach(sw => {
      this.ctx.save();
      this.ctx.strokeStyle = `rgba(241, 196, 15, ${Math.max(0, sw.alpha)})`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    });

    // 6. Desenha Partículas
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;

    // 7. Textos Flutuantes (Dano e Notificações)
    this.floatingTexts.forEach(ft => {
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(ft.text, ft.x, ft.y);
    });
    this.ctx.globalAlpha = 1.0;

    this.ctx.restore();
  }
}

// Inicia a instância do jogo no carregamento da janela
let game;
window.addEventListener('load', () => {
  game = new Game();
});
