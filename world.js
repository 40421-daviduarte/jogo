/**
 * world.js - Sistema de Mapa Interconectado, Biomas e Geração de Salas
 * Implementa a estrutura Metroidvania com salas em grade, tiles especiais e obstáculos
 * que exigem transformações específicas para abrir atalhos e progressão.
 */

// Dimensões Padrão de cada Sala
const ROOM_COLS = 25;
const ROOM_ROWS = 15;
const TILE_SIZE = 32;
const ROOM_WIDTH = ROOM_COLS * TILE_SIZE;  // 800px
const ROOM_HEIGHT = ROOM_ROWS * TILE_SIZE; // 480px

// Constantes de Tipos de Tiles
const TILE = {
  EMPTY: 0,
  SOLID: 1,             // Bloco sólido padrão do bioma
  PLATFORM: 2,          // Plataforma atravessável por baixo
  TUNNEL: 3,            // Fenda/Túnel estreito (apenas Rato)
  CRACKED_ROCK: 4,      // Parede de Rocha Rachada (apenas Gorila destrói)
  SOFT_DIRT: 5,         // Solo de Terra Macia (apenas Tamanduá escava)
  WATER: 6,             // Bloco de Água (Tubarão nada livremente)
  CRUMBLING: 7,         // Piso desmoronante rápido (exige Guepardo)
  TIMED_GATE: 8,        // Porta com Temporizador
  SPIKES: 9,            // Espinhos / Espinheiros Venenosos
  TOTEM_ALTAR: 10,      // Altar de Transformação Ancestral
  CHEST: 11,            // Baú com Relíquia/Melhoria
  CHECKPOINT: 12,       // Totem de Checkpoint / Cura
  LORE_STONE: 13,       // Monólito com História e Dicas
  PUSH_BLOCK: 14        // Bloco Pesado Empurrável (apenas Gorila)
};

// Definição dos Biomas e Atmosferas Visuais
const BIOMES = {
  forest: {
    name: 'Bosque Sagrado',
    bgColor: '#0f1f1a',
    bgGradient: ['#1a332a', '#0a1411'],
    tileSolid: '#2d5a3f',
    tileTop: '#58b368',
    particleColor: 'rgba(88, 179, 104, 0.4)'
  },
  caves: {
    name: 'Cavernas Subterrâneas',
    bgColor: '#10141a',
    bgGradient: ['#1b232e', '#090b0e'],
    tileSolid: '#34495e',
    tileTop: '#1abc9c',
    particleColor: 'rgba(26, 188, 156, 0.3)'
  },
  swamp: {
    name: 'Pântano Submerso',
    bgColor: '#0c1a1f',
    bgGradient: ['#122d36', '#061014'],
    tileSolid: '#16a085',
    tileTop: '#00cec9',
    particleColor: 'rgba(0, 206, 201, 0.3)'
  },
  canyon: {
    name: 'Cânion das Tempestades',
    bgColor: '#211510',
    bgGradient: ['#38241b', '#130c09'],
    tileSolid: '#d35400',
    tileTop: '#f39c12',
    particleColor: 'rgba(243, 156, 18, 0.3)'
  },
  ruins: {
    name: 'Fortaleza Ancestral',
    bgColor: '#161021',
    bgGradient: ['#281d3d', '#0d0914'],
    tileSolid: '#4834d4',
    tileTop: '#a29bfe',
    particleColor: 'rgba(162, 155, 254, 0.4)'
  }
};

class World {
  constructor() {
    this.rooms = new Map(); // Chave: "x,y"
    this.visitedRooms = new Set();
    this.openedChests = new Set();
    this.unlockedTotems = new Set();
    this.currentRoomX = 0;
    this.currentRoomY = 0;
    this.destructibles = new Map(); // Blocos destruídos na sessão
    this.pushBlocks = [];
    this.crumblingTiles = [];
    this.buildWorldMap();
  }

  getRoomKey(rx, ry) {
    return `${rx},${ry}`;
  }

  getCurrentRoom() {
    return this.rooms.get(this.getRoomKey(this.currentRoomX, this.currentRoomY));
  }

  buildWorldMap() {
    // -------------------------------------------------------------
    // SALA (0,0) - Bosque Sagrado: Início da Jornada
    // Introdução aos controles, pulo, e uma fenda de Rato secreta à esquerda!
    // -------------------------------------------------------------
    this.createRoom(0, 0, 'forest', {
      lore: 'Bem-vindo, Kael. As bestas sagradas foram silenciadas pelo Vazio. Encontre os Totens para recuperar a harmonia.',
      checkpoint: { x: 5, y: 12 },
      loreStone: { x: 8, y: 12, text: 'Monólito: "O pequeno roedor conhece os segredos que os gigantes ignoram."' },
      setup: (grid) => {
        // Chão sólido com bolsão de terra macia escavável pelo Tamanduá que leva às Catacumbas (0, 1)!
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillHLine(grid, 13, 10, 14, TILE.SOFT_DIRT);

        // Paredes com saídas
        this.fillVLine(grid, 0, 0, 11, TILE.SOLID); // Bloqueio com fenda
        grid[12][0] = TILE.TUNNEL; // Fenda de Rato secreta que leva a uma sala secreta (-1,0)!
        
        // Plataformas iniciais
        this.fillHLine(grid, 10, 12, 16, TILE.PLATFORM);
        this.fillHLine(grid, 7, 18, 22, TILE.PLATFORM);

        // Saída para a direita (0,0) -> (1,0)
      }
    });

    // -------------------------------------------------------------
    // SALA (-1,0) - Bosque Secreto (Apenas Rato acessa)
    // Recompensa com Baú de Relíquia
    // -------------------------------------------------------------
    this.createRoom(-1, 0, 'forest', {
      chest: { id: 'chest_mouse_forest', x: 6, y: 12, reward: 'relic', amount: 50 },
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 0, 0, 14, TILE.SOLID);
        this.fillHLine(grid, 0, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 24, 0, 11, TILE.SOLID);
        grid[12][24] = TILE.TUNNEL; // Conexão com (0,0)
      }
    });

    // -------------------------------------------------------------
    // SALA (0,1) - Catacumbas das Raízes Sagradas (Nova Área Desbloqueada por Escavação)
    // Acessível ao escavar a terra macia no solo de (0,0) com as garras do Tamanduá!
    // -------------------------------------------------------------
    this.createRoom(0, 1, 'caves', {
      lore: 'Catacumbas Esquecidas: santuário subterrâneo selado sob o Bosque Sagrado, aberto pelas garras do Tamanduá!',
      chest: { id: 'chest_catacombs_roots', x: 12, y: 11, reward: 'relic', amount: 80 },
      enemies: [
        { type: 'burrower', x: 6, y: 12 },
        { type: 'bat', x: 18, y: 6 }
      ],
      setup: (grid) => {
        // Teto de rocha com abertura escavada de (0,0)
        this.fillHLine(grid, 0, 0, 9, TILE.SOLID);
        this.fillHLine(grid, 0, 15, 24, TILE.SOLID);

        // Chão sólido
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 0, 0, 14, TILE.SOLID); // Fechado à esquerda

        // Plataformas ancestrais de pedra
        this.fillHLine(grid, 9, 4, 8, TILE.PLATFORM);
        this.fillHLine(grid, 6, 10, 14, TILE.PLATFORM);
        this.fillHLine(grid, 9, 16, 20, TILE.PLATFORM);

        // Bloco de terra macia adicional escondendo bônus
        this.fillHLine(grid, 12, 17, 21, TILE.SOFT_DIRT);
      }
    });

    // -------------------------------------------------------------
    // SALA (1,0) - Bosque Sagrado: O Despertar do Rato
    // Altar do Rato desbloqueia a primeira transformação!
    // -------------------------------------------------------------
    this.createRoom(1, 0, 'forest', {
      totem: { form: 'mouse', x: 18, y: 12, name: 'Espírito do Rato' },
      enemies: [
        { type: 'slime', x: 8, y: 12 },
        { type: 'slime', x: 13, y: 12 }
      ],
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillHLine(grid, 10, 5, 10, TILE.PLATFORM);
        // Parede de rocha rachada à direita que desce para as cavernas
        this.fillVLine(grid, 24, 0, 14, TILE.SOLID);
        grid[11][24] = TILE.EMPTY;
        grid[12][24] = TILE.EMPTY; // Passagem aberta para (2,0)
      }
    });

    // -------------------------------------------------------------
    // SALA (2,0) - Bosque Sagrado: A Fenda e o Portão de Pedra
    // Exige o Rato para passar por um túnel e acionar uma alavanca
    // Ou Gorila para quebrar a parede de pedra rachada à direita
    // -------------------------------------------------------------
    this.createRoom(2, 0, 'forest', {
      enemies: [{ type: 'boar', x: 15, y: 12 }],
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        // Estrutura que divide a sala: túnel de 1 bloco na base
        this.fillVLine(grid, 10, 3, 11, TILE.SOLID);
        grid[12][10] = TILE.TUNNEL; // Túnel para o Rato passar!
        
        // Parede de pedra rachada para descer às cavernas (2,1)
        grid[13][18] = TILE.CRACKED_ROCK;
        grid[13][19] = TILE.CRACKED_ROCK;
        
        // Passagem para a direita (3,0)
      }
    });

    // -------------------------------------------------------------
    // SALA (2,1) - Cavernas Subterrâneas: Entrada do Subsolo
    // Solo de terra macia (Tamanduá) e rochas pesadas
    // -------------------------------------------------------------
    this.createRoom(2, 1, 'caves', {
      loreStone: { x: 5, y: 12, text: 'Monólito: "O Gorila possui a força titânica para estilhaçar as pedras ancestrais."' },
      checkpoint: { x: 3, y: 12 },
      enemies: [
        { type: 'bat', x: 12, y: 5 },
        { type: 'bat', x: 18, y: 6 }
      ],
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        // Terra macia para cavar no chão
        this.fillHLine(grid, 13, 8, 14, TILE.SOFT_DIRT);
        this.fillHLine(grid, 9, 4, 8, TILE.PLATFORM);
        this.fillHLine(grid, 6, 14, 20, TILE.PLATFORM);

        // Bloco empurrável de pedra
        grid[12][16] = TILE.PUSH_BLOCK;

        // Saída para a esquerda para a arena do chefe (1,1)
      }
    });

    // -------------------------------------------------------------
    // SALA (1,1) - Cavernas: Arena do Chefe Cragmor (O Titã de Pedra)
    // Derrotar Cragmor liberta o Totem do Gorila!
    // -------------------------------------------------------------
    this.createRoom(1, 1, 'caves', {
      boss: { id: 'cragmor', name: 'Cragmor, o Titã Pétreo', x: 14, y: 8, rewardTotem: 'gorilla' },
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 0, 0, 14, TILE.SOLID); // Fechado à esquerda
        this.fillHLine(grid, 8, 3, 7, TILE.PLATFORM);
        this.fillHLine(grid, 8, 17, 21, TILE.PLATFORM);
      }
    });

    // -------------------------------------------------------------
    // SALA (3,0) - Bosque Sagrado / Entrada do Pântano
    // Lago inicial e Totem do Tamanduá em ruínas subterrâneas
    // -------------------------------------------------------------
    this.createRoom(3, 0, 'forest', {
      totem: { form: 'anteater', x: 21, y: 12, name: 'Espírito do Tamanduá' },
      enemies: [{ type: 'slime', x: 8, y: 12 }],
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 16, TILE.SOLID);
        // Lago pequeno de água
        for (let x = 16; x <= 19; x++) {
          grid[13][x] = TILE.WATER;
          grid[14][x] = TILE.SOLID;
        }
        this.fillHLine(grid, 13, 20, 24, TILE.SOLID);

        // Solo de terra macia subterrâneo escondendo o altar
        this.fillHLine(grid, 10, 18, 23, TILE.SOFT_DIRT);

        // Barreira espessa de terra macia bloqueando a saída leste para a Gruta Cristalina (4, 0)
        this.fillVLine(grid, 24, 7, 13, TILE.SOFT_DIRT);
        this.fillVLine(grid, 23, 7, 13, TILE.SOFT_DIRT);
      }
    });

    // -------------------------------------------------------------
    // SALA (4,0) - Gruta Cristalina das Raízes (Nova Área Desbloqueada por Escavação)
    // Descoberta ao escavar a parede de terra macia a leste da Sala (3,0) com o Tamanduá!
    // -------------------------------------------------------------
    this.createRoom(4, 0, 'caves', {
      lore: 'Santuário Oculto dos Cristais: revelado após escavar a parede de terra macia a leste do Bosque!',
      chest: { id: 'chest_crystal_grotto', x: 18, y: 11, reward: 'relic', amount: 100 },
      enemies: [
        { type: 'burrower', x: 8, y: 12 },
        { type: 'burrower', x: 14, y: 12 },
        { type: 'bat', x: 12, y: 5 }
      ],
      setup: (grid) => {
        // Chão sólido
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 24, 0, 13, TILE.SOLID); // Fechado à direita

        // Plataformas cristalinas elevadas
        this.fillHLine(grid, 9, 3, 8, TILE.PLATFORM);
        this.fillHLine(grid, 6, 10, 16, TILE.PLATFORM);
        this.fillHLine(grid, 9, 17, 22, TILE.PLATFORM);

        // Paredes de terra macia adicionais escondendo o baú
        this.fillVLine(grid, 16, 10, 12, TILE.SOFT_DIRT);
      }
    });

    // -------------------------------------------------------------
    // SALA (3,1) - Pântano dos Murmúrios: Águas Profundas
    // Introdução à água e túneis subaquáticos
    // -------------------------------------------------------------
    this.createRoom(3, 1, 'swamp', {
      enemies: [
        { type: 'aquatic_serpent', x: 10, y: 10 },
        { type: 'aquatic_serpent', x: 18, y: 9 }
      ],
      setup: (grid) => {
        // Enche parte inferior com água
        for (let r = 7; r <= 13; r++) {
          for (let c = 5; c <= 24; c++) {
            grid[r][c] = TILE.WATER;
          }
        }
        this.fillHLine(grid, 14, 0, 24, TILE.SOLID);
        this.fillHLine(grid, 6, 0, 5, TILE.SOLID);
        this.fillHLine(grid, 13, 0, 4, TILE.SOLID);
      }
    });

    // -------------------------------------------------------------
    // SALA (4,1) - Pântano dos Murmúrios: Arena da Serpente Scylla
    // Chefe Aquático: Derrotá-lo liberta o Totem do Tubarão!
    // -------------------------------------------------------------
    this.createRoom(4, 1, 'swamp', {
      boss: { id: 'scylla', name: 'Scylla, o Leviatã do Pântano', x: 14, y: 7, rewardTotem: 'shark' },
      checkpoint: { x: 2, y: 5 },
      setup: (grid) => {
        this.fillHLine(grid, 6, 0, 4, TILE.SOLID);
        this.fillHLine(grid, 6, 20, 24, TILE.SOLID);
        this.fillHLine(grid, 14, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 24, 0, 14, TILE.SOLID);

        // Lago central amplo
        for (let r = 7; r <= 13; r++) {
          for (let c = 4; c <= 20; c++) {
            grid[r][c] = TILE.WATER;
          }
        }
      }
    });

    // -------------------------------------------------------------
    // SALA (0,-1) - Cânion das Tempestades: Ventos Uivantes
    // Grandes abismos e plataformas desmoronantes
    // -------------------------------------------------------------
    this.createRoom(0, -1, 'canyon', {
      loreStone: { x: 3, y: 12, text: 'Monólito: "Apenas o Guepardo pode saltar sobre as pontes que cedem ao menor peso."' },
      enemies: [{ type: 'golem', x: 16, y: 12 }],
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 6, TILE.SOLID);
        // Ponte desmoronante rápida
        this.fillHLine(grid, 13, 7, 13, TILE.CRUMBLING);
        this.fillHLine(grid, 13, 14, 24, TILE.SOLID);

        // Abismo com espinhos embaixo
        this.fillHLine(grid, 14, 7, 13, TILE.SPIKES);
      }
    });

    // -------------------------------------------------------------
    // SALA (1,-1) - Cânion das Tempestades: Arena de Zephyrion
    // Chefe Veloz: Derrotá-lo liberta o Totem do Guepardo!
    // -------------------------------------------------------------
    this.createRoom(1, -1, 'canyon', {
      boss: { id: 'zephyrion', name: 'Zephyrion, Quimera dos Ventos', x: 16, y: 6, rewardTotem: 'cheetah' },
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 0, 0, 14, TILE.SOLID);
        this.fillHLine(grid, 9, 4, 8, TILE.PLATFORM);
        this.fillHLine(grid, 9, 16, 20, TILE.PLATFORM);
      }
    });

    // -------------------------------------------------------------
    // SALA (2,2) - Fortaleza Ancestral: Ante-câmara dos Guardiões
    // Exige combinar habilidades: Quebrar parede de rocha (Gorila),
    // cavar solo de terra (Tamanduá) e nadar por conduto (Tubarão)
    // -------------------------------------------------------------
    this.createRoom(2, 2, 'ruins', {
      checkpoint: { x: 3, y: 12 },
      chest: { id: 'chest_ruins_hp', x: 12, y: 3, reward: 'max_hp', amount: 20 },
      enemies: [
        { type: 'golem', x: 8, y: 12 },
        { type: 'burrower', x: 17, y: 12 }
      ],
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        // Parede de rocha que o Gorila deve quebrar
        this.fillVLine(grid, 6, 8, 12, TILE.CRACKED_ROCK);

        // Canal de água para o Tubarão
        for (let r = 10; r <= 12; r++) {
          grid[r][13] = TILE.WATER;
          grid[r][14] = TILE.WATER;
        }

        // Terra macia para o Tamanduá
        this.fillHLine(grid, 13, 16, 20, TILE.SOFT_DIRT);
      }
    });

    // -------------------------------------------------------------
    // SALA (3,2) - Fortaleza Ancestral: O Santuário do Vazio
    // Chefe Final: O Senhor da Corrupção (Void Lord)
    // -------------------------------------------------------------
    this.createRoom(3, 2, 'ruins', {
      boss: { id: 'void_lord', name: 'O Senhor da Corrupção', x: 14, y: 6, isFinalBoss: true },
      setup: (grid) => {
        this.fillHLine(grid, 13, 0, 24, TILE.SOLID);
        this.fillVLine(grid, 24, 0, 14, TILE.SOLID); // Fechado à direita
        this.fillHLine(grid, 9, 3, 7, TILE.PLATFORM);
        this.fillHLine(grid, 9, 17, 21, TILE.PLATFORM);
        this.fillHLine(grid, 5, 10, 14, TILE.PLATFORM);
      }
    });
  }

  createRoom(rx, ry, biomeKey, config = {}) {
    const grid = [];
    for (let r = 0; r < ROOM_ROWS; r++) {
      grid[r] = new Array(ROOM_COLS).fill(TILE.EMPTY);
    }

    if (config.setup) {
      config.setup(grid);
    }

    const room = {
      x: rx,
      y: ry,
      biome: biomeKey,
      grid: grid,
      lore: config.lore || null,
      loreStone: config.loreStone || null,
      checkpoint: config.checkpoint || null,
      totem: config.totem || null,
      chest: config.chest || null,
      boss: config.boss || null,
      enemiesData: config.enemies || [],
      enemies: [] // Instâncias ativas
    };

    this.rooms.set(this.getRoomKey(rx, ry), room);
  }

  fillHLine(grid, r, c1, c2, tileType) {
    for (let c = c1; c <= c2; c++) {
      if (r >= 0 && r < ROOM_ROWS && c >= 0 && c < ROOM_COLS) {
        grid[r][c] = tileType;
      }
    }
  }

  fillVLine(grid, c, r1, r2, tileType) {
    for (let r = r1; r <= r2; r++) {
      if (r >= 0 && r < ROOM_ROWS && c >= 0 && c < ROOM_COLS) {
        grid[r][c] = tileType;
      }
    }
  }

  // Quebrar bloco destrutível (parede de rocha do Gorila)
  destroyTile(rx, ry, tileC, tileR) {
    const key = `${rx},${ry}_${tileC},${tileR}`;
    this.destructibles.set(key, true);

    const room = this.rooms.get(this.getRoomKey(rx, ry));
    if (room && room.grid[tileR] && room.grid[tileR][tileC] === TILE.CRACKED_ROCK) {
      room.grid[tileR][tileC] = TILE.EMPTY;
      return true;
    }
    return false;
  }

  isTileDestroyed(rx, ry, tileC, tileR) {
    return this.destructibles.has(`${rx},${ry}_${tileC},${tileR}`);
  }

  // --- Renderização do Cenário e Tiles ---

  draw(ctx, camera) {
    const room = this.getCurrentRoom();
    if (!room) return;

    const biome = BIOMES[room.biome] || BIOMES.forest;

    // Fundo Gradiente Atmosférico
    const grad = ctx.createLinearGradient(0, 0, 0, ROOM_HEIGHT);
    grad.addColorStop(0, biome.bgGradient[0]);
    grad.addColorStop(1, biome.bgGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

    // Efeito Parallax de Fundo
    this.drawParallaxBackdrop(ctx, room.biome, camera);

    // Desenhar Grid de Tiles
    for (let r = 0; r < ROOM_ROWS; r++) {
      for (let c = 0; c < ROOM_COLS; c++) {
        const tile = room.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (tile === TILE.EMPTY) continue;

        switch (tile) {
          case TILE.SOLID:
            this.drawSolidTile(ctx, x, y, biome, r > 0 && room.grid[r - 1][c] === TILE.EMPTY);
            break;

          case TILE.PLATFORM:
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(x, y, TILE_SIZE, 6);
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(x, y + 6, TILE_SIZE, 2);
            break;

          case TILE.TUNNEL:
            // Fenda estreita de 1 bloco de altura
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Placas de rocha delimitando a fenda estreita
            ctx.fillStyle = biome.tileSolid;
            ctx.fillRect(x, y, TILE_SIZE, 8);
            ctx.fillRect(x, y + TILE_SIZE - 8, TILE_SIZE, 8);
            break;

          case TILE.CRACKED_ROCK:
            // Rocha Rachada (Destrutível pelo Gorila)
            ctx.fillStyle = '#57606f';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            // Rachaduras expressivas
            ctx.strokeStyle = '#ffa502';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 4);
            ctx.lineTo(x + 14, y + 16);
            ctx.lineTo(x + 28, y + 12);
            ctx.moveTo(x + 14, y + 16);
            ctx.lineTo(x + 18, y + 28);
            ctx.stroke();
            break;

          case TILE.SOFT_DIRT:
            // Terra Macia (Escavável pelo Tamanduá)
            ctx.fillStyle = '#795548';
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#8d6e63';
            // Pequenos grânulos de terra
            ctx.fillRect(x + 4, y + 6, 4, 4);
            ctx.fillRect(x + 18, y + 12, 5, 4);
            ctx.fillRect(x + 10, y + 22, 4, 4);
            break;

          case TILE.WATER: {
            const time = performance.now() * 0.003;
            const isSurface = (r === 0 || !room.grid[r - 1] || room.grid[r - 1][c] !== TILE.WATER);

            // Gradiente de profundidade da água submersa
            const waterGrad = ctx.createLinearGradient(x, y, x, y + TILE_SIZE);
            waterGrad.addColorStop(0, 'rgba(9, 132, 227, 0.65)');
            waterGrad.addColorStop(1, 'rgba(10, 61, 98, 0.88)');
            ctx.fillStyle = waterGrad;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Refração de luz subaquática (Caustics dinâmicos em feixes)
            const causticShift = Math.sin(time * 2.5 + (x + y) * 0.04) * 4;
            ctx.fillStyle = 'rgba(223, 249, 251, 0.12)';
            ctx.beginPath();
            ctx.moveTo(x + 2 + causticShift, y);
            ctx.lineTo(x + 10 + causticShift, y);
            ctx.lineTo(x + 18 + causticShift, y + TILE_SIZE);
            ctx.lineTo(x + 10 + causticShift, y + TILE_SIZE);
            ctx.closePath();
            ctx.fill();

            // Bolhas de ar subindo continuamente
            const bubbleRelY = (TILE_SIZE - ((time * 22 + c * 9) % TILE_SIZE));
            const bubbleY = y + bubbleRelY;
            const bubbleX = x + 8 + Math.sin(time * 3 + r * 2) * 5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Ondulação dinâmica na superfície
            if (isSurface) {
              const waveY1 = Math.sin(time * 4 + c * 1.5) * 3;
              const waveY2 = Math.sin(time * 4 + (c + 1) * 1.5) * 3;

              // Espuma cintilante e crista de onda
              ctx.fillStyle = 'rgba(223, 249, 251, 0.85)';
              ctx.beginPath();
              ctx.moveTo(x, y + 2 + waveY1);
              ctx.lineTo(x + TILE_SIZE, y + 2 + waveY2);
              ctx.lineTo(x + TILE_SIZE, y + 5 + waveY2);
              ctx.lineTo(x, y + 5 + waveY1);
              ctx.closePath();
              ctx.fill();

              // Linha de reflexo da crista
              ctx.strokeStyle = '#74b9ff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(x, y + 2 + waveY1);
              ctx.lineTo(x + TILE_SIZE, y + 2 + waveY2);
              ctx.stroke();
            } else {
              // Brilho suave nas camadas intermediárias
              ctx.fillStyle = 'rgba(0, 206, 201, 0.08)';
              ctx.fillRect(x, y, TILE_SIZE, 3);
            }
            break;
          }

          case TILE.CRUMBLING:
            // Plataforma que desmorona (Guepardo corre)
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(x, y, TILE_SIZE, 8);
            ctx.strokeStyle = '#d35400';
            ctx.strokeRect(x, y, TILE_SIZE, 8);
            break;

          case TILE.SPIKES:
            // Espinhos mortais
            ctx.fillStyle = '#c0392b';
            for (let i = 0; i < TILE_SIZE; i += 8) {
              ctx.beginPath();
              ctx.moveTo(x + i, y + TILE_SIZE);
              ctx.lineTo(x + i + 4, y + TILE_SIZE - 12);
              ctx.lineTo(x + i + 8, y + TILE_SIZE);
              ctx.fill();
            }
            break;

          case TILE.PUSH_BLOCK:
            // Bloco Pesado Empurrável
            ctx.fillStyle = '#747d8c';
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            ctx.strokeStyle = '#2f3542';
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            break;
        }
      }
    }

    // Desenhar Elementos Interativos da Sala
    this.drawRoomProps(ctx, room);
  }

  drawSolidTile(ctx, x, y, biome, isTop) {
    ctx.fillStyle = biome.tileSolid;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    if (isTop) {
      ctx.fillStyle = biome.tileTop;
      ctx.fillRect(x, y, TILE_SIZE, 6);
      // Grama/cristais pendendo
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 6); ctx.lineTo(x + 8, y + 10); ctx.lineTo(x + 12, y + 6);
      ctx.moveTo(x + 18, y + 6); ctx.lineTo(x + 22, y + 10); ctx.lineTo(x + 26, y + 6);
      ctx.fill();
    }
  }

  drawRoomProps(ctx, room) {
    const t = Date.now() * 0.003;

    // 1. Altar de Totem
    if (room.totem && !this.unlockedTotems.has(room.totem.form)) {
      const tx = room.totem.x * TILE_SIZE;
      const ty = room.totem.y * TILE_SIZE;
      
      // Pedestal
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(tx + 4, ty + 16, 24, 16);
      
      // Totem Flutuante com Brilho Mágico
      const bob = Math.sin(t) * 4;
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(tx + 16, ty + 6 + bob, 10, 0, Math.PI * 2);
      ctx.fill();

      // Aura pulsante
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tx + 16, ty + 6 + bob, 14 + Math.sin(t * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Texto de interação
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Despertar Totem', tx + 16, ty - 6);
    }

    // 2. Baú de Tesouro
    if (room.chest && !this.openedChests.has(room.chest.id)) {
      const cx = room.chest.x * TILE_SIZE;
      const cy = room.chest.y * TILE_SIZE;

      ctx.fillStyle = '#8e44ad';
      ctx.fillRect(cx + 4, cy + 12, 24, 20);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(cx + 2, cy + 8, 28, 6);
      ctx.fillRect(cx + 14, cy + 14, 4, 6);

      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('[E] Abrir', cx + 16, cy - 4);
    }

    // 3. Fogueira / Checkpoint
    if (room.checkpoint) {
      const chx = room.checkpoint.x * TILE_SIZE;
      const chy = room.checkpoint.y * TILE_SIZE;

      // Base de pedras
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(chx + 6, chy + 24, 20, 8);

      // Chamas azuis místicas
      ctx.fillStyle = '#00cec9';
      ctx.beginPath();
      ctx.arc(chx + 16, chy + 18 + Math.sin(t * 3) * 2, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Monólito de Lore
    if (room.loreStone) {
      const lx = room.loreStone.x * TILE_SIZE;
      const ly = room.loreStone.y * TILE_SIZE;

      ctx.fillStyle = '#34495e';
      ctx.fillRect(lx + 6, ly + 2, 20, 30);
      // Runas brilhantes
      ctx.fillStyle = '#38ef7d';
      ctx.fillRect(lx + 10, ly + 8, 12, 2);
      ctx.fillRect(lx + 12, ly + 14, 8, 2);
      ctx.fillRect(lx + 10, ly + 20, 12, 2);
    }
  }

  drawParallaxBackdrop(ctx, biomeKey, camera) {
    // Camadas de montanhas e silhuetas distantes
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, ROOM_HEIGHT);
    for (let x = 0; x <= ROOM_WIDTH; x += 100) {
      ctx.lineTo(x, ROOM_HEIGHT - 120 + Math.sin(x * 0.02) * 40);
    }
    ctx.lineTo(ROOM_WIDTH, ROOM_HEIGHT);
    ctx.fill();
    ctx.restore();
  }
}
