// Polyfill de compatibilidade para CanvasRenderingContext2D.roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'undefined') r = 4;
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
    return this;
  };
}

class SpriteRenderer {
  constructor() {
    this.sparkles = [];
  }

  // --- Renderização do Protagonista por Forma ---

  drawPlayer(ctx, player) {
    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));

    // Espelhar horizontalmente dependendo da direção
    if (player.facing === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-player.width, 0);
    }

    // Efeito de invencibilidade / dano (piscar)
    if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Rastro de velocidade do Guepardo
    if (player.form === 'cheetah' && (Math.abs(player.vx) > 3.5 || player.isDashing)) {
      this.drawSpeedGhost(ctx, player);
    }

    // Desenha a forma atual
    switch (player.form) {
      case 'human':
        this.drawHuman(ctx, player);
        break;
      case 'mouse':
        this.drawMouse(ctx, player);
        break;
      case 'gorilla':
        this.drawGorilla(ctx, player);
        break;
      case 'cheetah':
        this.drawCheetah(ctx, player);
        break;
      case 'shark':
        this.drawShark(ctx, player);
        break;
      case 'anteater':
        this.drawAnteater(ctx, player);
        break;
    }

    // Efeito visual de golpe / corte
    if (player.attackTimer > 0) {
      this.drawAttackEffect(ctx, player);
    }

    // Escudo Totêmico Místico (Defesa Ativa)
    if (player.isDefending) {
      this.drawTotemShield(ctx, player);
    }

    ctx.restore();
  }

  // 1. Forma Humana (Kael)
  drawHuman(ctx, p) {
    const time = p.animTime || 0;
    const isMoving = Math.abs(p.vx) > 0.2 && p.onGround;
    const isJumping = !p.onGround;
    const bob = isMoving ? Math.sin(time * 12) * 2 : Math.sin(time * 3) * 0.8;
    const legSwing = isMoving ? Math.sin(time * 12) * 6 : 0;

    // Capa mística esvoaçante
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(8, 14 + bob);
    ctx.quadraticCurveTo(
      -4 - (isMoving ? 8 : 2),
      22 + (isMoving ? Math.sin(time * 10) * 4 : 0),
      -6 - (isMoving ? 12 : 1),
      34 + (isJumping ? -4 : 0)
    );
    ctx.lineTo(12, 28);
    ctx.closePath();
    ctx.fill();

    // Pernas / Botas
    ctx.fillStyle = '#2c3e50';
    // Perna de trás
    ctx.fillRect(6 - legSwing, 28, 5, 12);
    // Perna da frente
    ctx.fillStyle = '#34495e';
    ctx.fillRect(11 + legSwing, 28, 5, 12);

    // Torso / Túnica Azul
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(6, 12 + bob, 12, 16);

    // Faixa / Cinto dourado
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(5, 23 + bob, 14, 3);

    // Cabeça
    ctx.fillStyle = '#fad390';
    ctx.beginPath();
    ctx.arc(12, 8 + bob, 6, 0, Math.PI * 2);
    ctx.fill();

    // Cabelo Castanho
    ctx.fillStyle = '#533a1e';
    ctx.beginPath();
    ctx.arc(11, 6 + bob, 6.5, Math.PI, Math.PI * 2);
    ctx.lineTo(6, 9 + bob);
    ctx.fill();

    // Olho
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(14, 6 + bob, 2, 2);

    // Braço & Espada
    ctx.fillStyle = '#fad390';
    if (p.attackTimer > 0) {
      // Braço esticado atacando
      ctx.fillRect(14, 14 + bob, 10, 4);
    } else {
      ctx.fillRect(10 + (isMoving ? -legSwing : 0), 14 + bob, 4, 10);
      // Cabo da espada nas costas
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(4, 8 + bob, 2, 8);
    }
  }

  // 2. Forma Rato (Pequeno, Furtivo, Ágil)
  drawMouse(ctx, p) {
    const time = p.animTime || 0;
    const isMoving = Math.abs(p.vx) > 0.2;
    const bob = isMoving ? Math.sin(time * 18) * 1.5 : Math.sin(time * 4) * 0.5;

    // Cauda flexível
    ctx.strokeStyle = '#e056fd';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(3, 10 + bob);
    ctx.bezierCurveTo(
      -4, 6 + Math.sin(time * 10) * 3,
      -8, 12 + Math.cos(time * 8) * 4,
      -10, 8 + Math.sin(time * 12) * 5
    );
    ctx.stroke();

    // Corpo cinza/lilás
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.ellipse(8, 9 + bob, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Focinho afunilado
    ctx.beginPath();
    ctx.moveTo(11, 7 + bob);
    ctx.lineTo(16, 9 + bob);
    ctx.lineTo(11, 11 + bob);
    ctx.closePath();
    ctx.fill();

    // Narizinho rosa
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(16, 9 + bob, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Olho preto brilhante
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(12, 7 + bob, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Orelha grande e redonda
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(7, 4 + bob, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Patinhas rápidas
    ctx.fillStyle = '#ff7675';
    const legOffset = isMoving ? Math.sin(time * 20) * 2 : 0;
    ctx.fillRect(4 + legOffset, 12, 3, 2);
    ctx.fillRect(10 - legOffset, 12, 3, 2);
  }

  // 3. Forma Gorila (Grande, Forte, Demolidor)
  drawGorilla(ctx, p) {
    const time = p.animTime || 0;
    const isMoving = Math.abs(p.vx) > 0.2 && p.onGround;
    const bob = isMoving ? Math.abs(Math.sin(time * 8)) * 3 : Math.sin(time * 3) * 1;
    const armSwing = isMoving ? Math.sin(time * 8) * 8 : 0;

    // Sombra do corpo
    ctx.fillStyle = '#1e272e';
    // Braço de trás / costas
    ctx.fillRect(4 - armSwing, 16 + bob, 9, 24);

    // Pernas curtas e fortes
    ctx.fillStyle = '#2f3542';
    ctx.fillRect(10, 32, 8, 12);
    ctx.fillRect(20, 32, 8, 12);

    // Torso massivo
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.roundRect(8, 12 + bob, 22, 22, 6);
    ctx.fill();

    // Peito prateado / detalhes musculares
    ctx.fillStyle = '#747d8c';
    ctx.beginPath();
    ctx.roundRect(14, 15 + bob, 14, 14, 4);
    ctx.fill();

    // Cabeça imponente
    ctx.fillStyle = '#2f3542';
    ctx.beginPath();
    ctx.arc(22, 9 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Mandíbula e olhos bravos
    ctx.fillStyle = '#ff4757';
    ctx.fillRect(25, 7 + bob, 2, 2);
    ctx.fillStyle = '#ced6e0';
    ctx.fillRect(26, 12 + bob, 3, 2); // presa

    // Braço colossal da frente
    ctx.fillStyle = '#1e272e';
    if (p.attackTimer > 0) {
      // Punho pronto para esmagar
      ctx.fillRect(20, 10 + bob, 16, 14);
      ctx.fillStyle = '#f1c40f';
      ctx.fillRect(32, 12 + bob, 5, 8); // nós de energia
    } else {
      ctx.fillRect(22 + armSwing, 16 + bob, 10, 24);
      // Punho fechado perto do solo
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(20 + armSwing, 34 + bob, 12, 8);
    }
  }

  // 4. Forma Guepardo (Veloz, Ágil, Dourado com Manchas)
  drawCheetah(ctx, p) {
    const time = p.animTime || 0;
    const isMoving = Math.abs(p.vx) > 0.2;
    const isSprinting = Math.abs(p.vx) > 3.5;
    const runFreq = isSprinting ? 24 : 14;
    const gallop = isMoving ? Math.sin(time * runFreq) * 3 : Math.sin(time * 3) * 0.5;

    // Cauda longa de equilíbrio
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(6, 12 + gallop);
    ctx.quadraticCurveTo(
      -4, 8 + Math.sin(time * 10) * 6,
      -10, 6 + (isSprinting ? 2 : Math.cos(time * 8) * 8)
    );
    ctx.stroke();

    // Ponta da cauda preta
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-9, 6 + (isSprinting ? 2 : Math.cos(time * 8) * 8), 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Corpo aerodinâmico dourado
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.ellipse(18, 12 + gallop, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Manchas escuras características
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(12, 9 + gallop, 2.5, 2.5);
    ctx.fillRect(17, 7 + gallop, 2.5, 2.5);
    ctx.fillRect(22, 11 + gallop, 2.5, 2.5);
    ctx.fillRect(15, 14 + gallop, 2.5, 2.5);

    // Pernas dianteiras e traseiras com ciclo de corrida
    ctx.fillStyle = '#d35400';
    const legOffset1 = isMoving ? Math.sin(time * runFreq) * 8 : 0;
    const legOffset2 = isMoving ? Math.cos(time * runFreq) * 8 : 0;

    // Pernas traseiras
    ctx.fillRect(8 + legOffset1, 16 + gallop, 3.5, 8);
    // Pernas dianteiras
    ctx.fillRect(24 - legOffset2, 16 + gallop, 3.5, 8);

    // Cabeça ágil
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(28, 9 + gallop, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Orelha pontuda
    ctx.beginPath();
    ctx.moveTo(25, 4 + gallop);
    ctx.lineTo(28, 1 + gallop);
    ctx.lineTo(30, 5 + gallop);
    ctx.fill();

    // Linha lacrimal preta & olho âmbar
    ctx.fillStyle = '#111';
    ctx.fillRect(29, 8 + gallop, 1.5, 4);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(29, 8 + gallop, 2, 2);
  }

  // 5. Forma Tubarão (Aquático, 360°, Veloz)
  drawShark(ctx, p) {
    const time = p.animTime || 0;
    const inWater = p.isInWater;
    const wave = inWater ? Math.sin(time * 10) * 3 : Math.sin(time * 18) * 5;

    // Barbatana Caudal
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.moveTo(4, 12);
    ctx.lineTo(-4, 4 + wave);
    ctx.lineTo(0, 12);
    ctx.lineTo(-4, 20 + wave);
    ctx.closePath();
    ctx.fill();

    // Corpo hidrodinâmico azul-ardósia
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.ellipse(18, 13, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ventre branco/cinza claro
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.ellipse(18, 16, 12, 4, 0, 0, Math.PI);
    ctx.fill();

    // Barbatana Dorsal Superior
    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.moveTo(14, 5);
    ctx.lineTo(19, -2);
    ctx.lineTo(23, 6);
    ctx.closePath();
    ctx.fill();

    // Olho frio e guelras
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(26, 11, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1e3799';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(21, 10); ctx.lineTo(21, 14);
    ctx.moveTo(23, 11); ctx.lineTo(23, 15);
    ctx.stroke();

    // Dentes afiados se atacando
    if (p.attackTimer > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(28, 14);
      ctx.lineTo(33, 14);
      ctx.lineTo(31, 18);
      ctx.closePath();
      ctx.fill();
    }

    // Bolhas na água
    if (inWater && Math.random() > 0.4) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(-2, 12 + wave, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Forma Tamanduá (Escavador, Garras Fortes, Focinho Longo)
  // 6. Forma do Tamanduá (Escavador Ancestral)
  drawAnteater(ctx, p) {
    const time = p.animTime || 0;
    const isMoving = Math.abs(p.vx) > 0.2;
    const isDigging = p.isDigging;
    const isClawing = p.digTimer > 0;
    const bob = isMoving ? Math.sin(time * 12) * 1.5 : Math.sin(time * 3) * 0.5;

    // Se estiver cavando, desenha poeira, montículo e rachaduras de solo
    if (isDigging || isClawing) {
      ctx.fillStyle = 'rgba(109, 76, 65, 0.85)';
      ctx.beginPath();
      ctx.ellipse(16, 20, 20, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Partículas e fagulhas de terra levantadas pelas garras
      ctx.fillStyle = '#a1887f';
      const digWave = Math.sin(time * 25) * 4;
      ctx.fillRect(26, 16 + digWave, 3, 3);
      ctx.fillRect(29, 20 - digWave, 4, 3);
      ctx.fillRect(-4, 18 + digWave, 3, 3);
    }

    // Cauda felpuda e densa
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.moveTo(4, 14 + bob);
    ctx.quadraticCurveTo(-8, 6, -14, 13 + (isMoving ? Math.sin(time * 8) * 3 : 0));
    ctx.quadraticCurveTo(-6, 23, 6, 18 + bob);
    ctx.closePath();
    ctx.fill();

    // Textura de pelos na cauda
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.moveTo(0, 15 + bob);
    ctx.quadraticCurveTo(-6, 10, -10, 14);
    ctx.quadraticCurveTo(-4, 20, 2, 17 + bob);
    ctx.closePath();
    ctx.fill();

    // Corpo musculoso cinza-acastanhado
    ctx.fillStyle = '#6d4c41';
    ctx.beginPath();
    ctx.ellipse(14, 13 + bob, 12, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Faixa diagonal preta típica com contorno claro
    ctx.fillStyle = '#f5f6fa';
    ctx.beginPath();
    ctx.moveTo(9, 8 + bob);
    ctx.lineTo(20, 6 + bob);
    ctx.lineTo(15, 19 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1e272e';
    ctx.beginPath();
    ctx.moveTo(10, 9 + bob);
    ctx.lineTo(18, 8 + bob);
    ctx.lineTo(14, 18 + bob);
    ctx.closePath();
    ctx.fill();

    // Focinho longo curvo tubular
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.moveTo(21, 10 + bob);
    ctx.quadraticCurveTo(28, 10 + bob, 33, 17 + (isDigging || isClawing ? 5 : bob));
    ctx.quadraticCurveTo(26, 17 + bob, 20, 15 + bob);
    ctx.closePath();
    ctx.fill();

    // Ponta do focinho preta
    ctx.fillStyle = '#212121';
    ctx.fillRect(31, 15 + (isDigging || isClawing ? 5 : bob), 3, 3);

    // Olho vivo
    ctx.fillStyle = '#111';
    ctx.fillRect(23, 10 + bob, 2.5, 2.5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(24, 10 + bob, 1, 1);

    // Patas traseiras e dianteiras
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(7, 16, 5, 8);
    ctx.fillRect(17, 16, 5, 8);

    // Garras frontais recurvadas de escavação
    ctx.strokeStyle = '#f5f6fa';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (isClawing) {
      // Garras golpeando ativamente para baixo/frente
      const clawSwing = Math.sin(time * 30) * 5;
      ctx.moveTo(22, 20);
      ctx.lineTo(29 + clawSwing, 24 + clawSwing);
      ctx.stroke();

      // Arcos de corte de garra
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(26, 22, 10, -0.3, 0.9);
      ctx.stroke();
    } else {
      ctx.moveTo(21, 21);
      ctx.lineTo(25, 25);
      ctx.stroke();
    }
  }

  // Rastro fantasma de velocidade (Guepardo)
  drawSpeedGhost(ctx, p) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(p.facing === 1 ? -12 : 12, 4, p.width, p.height - 4);
    ctx.restore();
  }

  // Efeito do Ataque
  drawAttackEffect(ctx, p) {
    ctx.save();
    const progress = 1 - (p.attackTimer / p.attackDuration);
    ctx.strokeStyle = p.form === 'gorilla' ? '#e74c3c' : (p.form === 'cheetah' ? '#f1c40f' : '#00d2d3');
    ctx.lineWidth = p.form === 'gorilla' ? 5 : 3;

    ctx.beginPath();
    ctx.arc(
      p.width + 4,
      p.height / 2,
      (p.form === 'gorilla' ? 24 : 16) * (0.6 + progress * 0.4),
      -Math.PI * 0.4,
      Math.PI * 0.4
    );
    ctx.stroke();
    ctx.restore();
  }

  // Escudo Totêmico Ancestral (Defesa Ativa)
  drawTotemShield(ctx, p) {
    ctx.save();
    const time = p.animTime || 0;
    const pulse = Math.sin(time * 10) * 2;
    const shieldX = p.width + 4;
    const shieldY = p.height / 2;
    const shieldRadius = Math.max(p.height / 2 + 5, 17);

    // Halo místico protetor externo
    const grad = ctx.createRadialGradient(shieldX, shieldY, 4, shieldX, shieldY, shieldRadius + 9 + pulse);
    grad.addColorStop(0, 'rgba(0, 206, 201, 0.55)');
    grad.addColorStop(0.6, 'rgba(52, 152, 219, 0.3)');
    grad.addColorStop(1, 'rgba(41, 128, 185, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(shieldX, shieldY, shieldRadius + 9 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Barreira rúnica principal em arco espelhado
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(shieldX, shieldY, shieldRadius + pulse, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();

    // Linha dourada interna com brilho sagrado
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(shieldX - 2, shieldY, shieldRadius - 4 + pulse * 0.5, -Math.PI * 0.38, Math.PI * 0.38);
    ctx.stroke();

    // Brasão totêmico ancestral em forma de losango
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(shieldX + 2, shieldY - 7);
    ctx.lineTo(shieldX + 7, shieldY);
    ctx.lineTo(shieldX + 2, shieldY + 7);
    ctx.lineTo(shieldX - 1, shieldY);
    ctx.closePath();
    ctx.fill();

    // Runas orbitais místicas
    for (let i = 0; i < 3; i++) {
      const angle = time * 5 + (i * Math.PI * 2) / 3;
      const ox = shieldX + Math.cos(angle) * (shieldRadius + 4);
      const oy = shieldY + Math.sin(angle) * (shieldRadius * 0.7);
      ctx.fillStyle = i === 0 ? '#f1c40f' : '#54a0ff';
      ctx.fillRect(ox - 1.5, oy - 1.5, 3, 3);
    }

    ctx.restore();
  }

  // --- Renderização Aprimorada de Inimigos ---

  drawEnemy(ctx, e) {
    ctx.save();
    ctx.translate(Math.round(e.x), Math.round(e.y));

    if (e.facing === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-e.width, 0);
    }

    const t = e.animTime || 0;
    const isHurt = e.hurtTimer > 0;

    switch (e.type) {
      case 'slime': {
        // Gosma Tóxica Saltitante: corpo gelatinoso translúcido, núcleo vivo e brilho
        const squish = Math.sin(t * 8) * 2.5;
        const width = 12 + squish;
        const height = 9 - squish;
        const cy = 13 + squish;

        // Base/sombra da gosma
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.ellipse(12, 19, 11 + squish, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Camada externa gelatinosa
        const slimeGrad = ctx.createRadialGradient(12, cy - 2, 2, 12, cy, 14);
        if (isHurt) {
          slimeGrad.addColorStop(0, '#ffffff');
          slimeGrad.addColorStop(1, '#ff6b81');
        } else {
          slimeGrad.addColorStop(0, '#55efc4');
          slimeGrad.addColorStop(0.7, '#00b894');
          slimeGrad.addColorStop(1, '#006266');
        }
        ctx.fillStyle = slimeGrad;
        ctx.beginPath();
        ctx.ellipse(12, cy, width, height, 0, 0, Math.PI * 2);
        ctx.fill();

        // Borda orgânica
        ctx.strokeStyle = isHurt ? '#fff' : '#009432';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Núcleo interno viscoso
        ctx.fillStyle = isHurt ? '#fff' : 'rgba(255, 234, 167, 0.7)';
        ctx.beginPath();
        ctx.ellipse(11, cy + 1, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bolhas subindo dentro da gosma
        const bubbleY = cy - 2 + Math.sin(t * 6) * 3;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(8, bubbleY, 1.5, 0, Math.PI * 2);
        ctx.arc(15, cy - 1, 1, 0, Math.PI * 2);
        ctx.fill();

        // Brilho especular curvo no topo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(9, cy - height + 3.5, 5, 2, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Olhos ferozes da gosma com sobrancelhas
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(12, cy - 2, 3, 4);
        ctx.fillRect(17, cy - 2, 3, 4);

        // Pupila vermelha/amarela agressiva
        ctx.fillStyle = '#ff3838';
        ctx.fillRect(13, cy - 1, 1.5, 2);
        ctx.fillRect(18, cy - 1, 1.5, 2);

        // Gotas escorrendo na base
        ctx.fillStyle = '#00b894';
        ctx.fillRect(6, 17, 2, 2);
        ctx.fillRect(16, 18, 2, 2);
        break;
      }

      case 'bat': {
        // Morcego Sombrio Cavernoso: asas articuladas, pelo texturizado e olhos vermelhos brilhantes
        const wingFlap = Math.sin(t * 15) * 8;
        const wingMid = Math.sin(t * 15 + 0.3) * 4;

        // Asas membranosas sombrias
        ctx.fillStyle = isHurt ? '#ffffff' : '#2d132c';
        ctx.strokeStyle = isHurt ? '#ff7675' : '#1e272e';
        ctx.lineWidth = 1.5;

        // Asa Direita / Frontal
        ctx.beginPath();
        ctx.moveTo(11, 10);
        ctx.quadraticCurveTo(18, 4 + wingMid, 26, 2 + wingFlap);
        ctx.lineTo(22, 11 + wingMid);
        ctx.lineTo(17, 9 + wingMid);
        ctx.lineTo(13, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Asa Esquerda / Traseira
        ctx.beginPath();
        ctx.moveTo(7, 10);
        ctx.quadraticCurveTo(0, 4 + wingMid, -7, 2 + wingFlap);
        ctx.lineTo(-3, 11 + wingMid);
        ctx.lineTo(1, 9 + wingMid);
        ctx.lineTo(5, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Garras nos cotovelos das asas
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(25, 1 + wingFlap, 2, 2);
        ctx.fillRect(-8, 1 + wingFlap, 2, 2);

        // Corpo peludo
        ctx.fillStyle = isHurt ? '#fff' : '#1e130c';
        ctx.beginPath();
        ctx.ellipse(9, 11, 4.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orelhas pontiagudas
        ctx.fillStyle = isHurt ? '#fff' : '#2c1810';
        ctx.beginPath();
        ctx.moveTo(6, 7); ctx.lineTo(4, 1); ctx.lineTo(8, 6);
        ctx.moveTo(11, 6); ctx.lineTo(13, 1); ctx.lineTo(13, 7);
        ctx.fill();
        // Interior rosado das orelhas
        ctx.fillStyle = '#e84118';
        ctx.fillRect(5, 3, 1.5, 2.5);
        ctx.fillRect(12, 3, 1.5, 2.5);

        // Cabeça
        ctx.fillStyle = isHurt ? '#fff' : '#2f3542';
        ctx.beginPath();
        ctx.arc(9, 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Olhos vermelhos malévolos que brilham
        ctx.fillStyle = '#ff3838';
        ctx.fillRect(7, 7, 2, 2);
        ctx.fillRect(10, 7, 2, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(7.5, 7.5, 1, 1);
        ctx.fillRect(10.5, 7.5, 1, 1);

        // Presas vampíricas
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(8, 10.5, 1, 2);
        ctx.fillRect(10, 10.5, 1, 2);
        break;
      }

      case 'boar': {
        // Javali Bestial Selvagem: silhueta musculosa, crista de espinhos e presas curvas
        const runCycle = Math.sin(t * 14) * 4;

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(16, 25, 14, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Patas traseira e dianteira esquerdas (ao fundo)
        ctx.fillStyle = isHurt ? '#fff' : '#1e272e';
        ctx.fillRect(6, 18, 4, 6 - runCycle * 0.4);
        ctx.fillRect(22, 18, 4, 6 + runCycle * 0.4);

        // Corpo volumoso sombreado
        const boarGrad = ctx.createLinearGradient(4, 6, 26, 22);
        boarGrad.addColorStop(0, isHurt ? '#ffffff' : '#6c5ce7');
        boarGrad.addColorStop(0.5, isHurt ? '#ff7675' : '#4834d4');
        boarGrad.addColorStop(1, isHurt ? '#d63031' : '#130f40');
        ctx.fillStyle = boarGrad;
        ctx.beginPath();
        ctx.roundRect(4, 8, 23, 13, 6);
        ctx.fill();

        // Crista de cerdas/espinhos negros ao longo do dorso
        ctx.fillStyle = isHurt ? '#fff' : '#130f40';
        for (let bx = 6; bx <= 22; bx += 3.5) {
          const spikeH = 4 + Math.sin(t * 10 + bx) * 1.5;
          ctx.beginPath();
          ctx.moveTo(bx, 8);
          ctx.lineTo(bx + 1.5, 8 - spikeH);
          ctx.lineTo(bx + 3, 8);
          ctx.fill();
        }

        // Cabeça robusta agressiva
        ctx.fillStyle = isHurt ? '#fff' : '#30336b';
        ctx.beginPath();
        ctx.moveTo(22, 10);
        ctx.lineTo(31, 14);
        ctx.lineTo(29, 21);
        ctx.lineTo(20, 20);
        ctx.closePath();
        ctx.fill();

        // Focinho e narina
        ctx.fillStyle = '#eb4d4b';
        ctx.fillRect(29, 15, 3, 4);
        ctx.fillStyle = '#130f40';
        ctx.fillRect(30, 16, 1.5, 2);

        // Olho furioso âmbar
        ctx.fillStyle = '#f0932b';
        ctx.fillRect(24, 12, 3, 2.5);
        ctx.fillStyle = '#130f40';
        ctx.fillRect(25.5, 12, 1.5, 2.5);

        // Grandes presas afiadas curvas de marfim
        ctx.fillStyle = '#f5f6fa';
        ctx.strokeStyle = '#dcdde1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(27, 20);
        ctx.quadraticCurveTo(34, 19, 33, 11);
        ctx.lineTo(31, 16);
        ctx.lineTo(28, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Patas dianteira e traseira direitas (em primeiro plano)
        ctx.fillStyle = isHurt ? '#fff' : '#2c2c54';
        ctx.fillRect(7, 18, 4.5, 6 + runCycle * 0.4);
        ctx.fillRect(23, 18, 4.5, 6 - runCycle * 0.4);
        // Cascos pretos
        ctx.fillStyle = '#130f40';
        ctx.fillRect(7, 23 + runCycle * 0.4, 4.5, 2);
        ctx.fillRect(23, 23 - runCycle * 0.4, 4.5, 2);

        // Pequeno rabo espetado
        ctx.strokeStyle = '#30336b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(4, 12);
        ctx.lineTo(0, 9 + Math.sin(t * 12) * 2);
        ctx.stroke();
        break;
      }

      case 'golem': {
        // Golem Blindado de Pedra Rúnica: blocos esculpidos, fendas luminosas e olho ciclope
        const gBob = Math.sin(t * 3) * 1.5;

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(16, 35, 15, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pés maciços de granito
        ctx.fillStyle = isHurt ? '#fff' : '#3d3d3d';
        ctx.fillRect(5, 30, 8, 5);
        ctx.fillRect(19, 30, 8, 5);

        // Torso de blocos rochosos com bisel
        const rockGrad = ctx.createLinearGradient(3, 4, 29, 30);
        rockGrad.addColorStop(0, isHurt ? '#ffffff' : '#8395a7');
        rockGrad.addColorStop(0.5, isHurt ? '#ff7675' : '#576574');
        rockGrad.addColorStop(1, isHurt ? '#d63031' : '#222f3e');
        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        ctx.roundRect(3, 4 + gBob, 26, 26, 4);
        ctx.fill();

        // Contorno das placas de pedra
        ctx.strokeStyle = isHurt ? '#ffffff' : '#222f3e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Musgo ancestral nas quinas rochosas
        ctx.fillStyle = '#10ac84';
        ctx.fillRect(3, 4 + gBob, 6, 3);
        ctx.fillRect(23, 4 + gBob, 6, 4);
        ctx.fillRect(4, 24 + gBob, 5, 3);

        // Ombreiras de pedra
        ctx.fillStyle = isHurt ? '#fff' : '#4b6584';
        ctx.fillRect(0, 6 + gBob, 5, 8);
        ctx.fillRect(27, 6 + gBob, 5, 8);

        // Fendas de energia mística rúnica pulsante
        const runePulse = Math.sin(t * 6) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(231, 76, 60, ${runePulse})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(9, 13 + gBob);
        ctx.lineTo(16, 19 + gBob);
        ctx.lineTo(12, 25 + gBob);
        ctx.moveTo(16, 19 + gBob);
        ctx.lineTo(23, 21 + gBob);
        ctx.stroke();

        // Runas secundárias
        ctx.strokeStyle = `rgba(243, 156, 18, ${runePulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(8, 22 + gBob);
        ctx.lineTo(10, 26 + gBob);
        ctx.stroke();

        // Olho mecânico ciclope incandescente
        ctx.fillStyle = '#222f3e';
        ctx.beginPath();
        ctx.arc(16, 11 + gBob, 5, 0, Math.PI * 2);
        ctx.fill();

        const eyeGrad = ctx.createRadialGradient(16, 11 + gBob, 1, 16, 11 + gBob, 5);
        eyeGrad.addColorStop(0, '#ffffff');
        eyeGrad.addColorStop(0.4, '#ff3838');
        eyeGrad.addColorStop(1, '#c23616');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(16, 11 + gBob, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'aquatic_serpent': {
        // Serpente d'Água Abissal: corpo ondulante segmentado, nadadeiras bioluminescentes e presas
        const sTime = t * 9;

        // Corpo segmentado ondulante em onda senoidal
        const segCount = 5;
        for (let i = segCount; i >= 0; i--) {
          const segX = 22 - i * 4.2;
          const segY = 10 + Math.sin(sTime - i * 0.7) * 4;
          const radius = i === 0 ? 5.5 : Math.max(3, 5 - i * 0.5);

          // Escamas brilhantes em gradiente
          const segGrad = ctx.createRadialGradient(segX, segY - 1, 1, segX, segY, radius + 2);
          segGrad.addColorStop(0, isHurt ? '#fff' : '#55efc4');
          segGrad.addColorStop(0.7, isHurt ? '#ff7675' : '#00cec9');
          segGrad.addColorStop(1, isHurt ? '#d63031' : '#0984e3');
          ctx.fillStyle = segGrad;
          ctx.beginPath();
          ctx.arc(segX, segY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Crista dorsal bioluminescente translúcida
          if (i > 0 && i < segCount) {
            ctx.fillStyle = 'rgba(0, 206, 201, 0.8)';
            ctx.beginPath();
            ctx.moveTo(segX, segY - radius);
            ctx.lineTo(segX - 2, segY - radius - 4);
            ctx.lineTo(segX + 2, segY - radius);
            ctx.fill();
          }
        }

        // Cabeça de dragão marinho (segmento 0)
        const headY = 10 + Math.sin(sTime) * 4;
        ctx.fillStyle = isHurt ? '#fff' : '#00cec9';
        ctx.beginPath();
        ctx.ellipse(22, headY, 6, 4.5, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Chifre/crista aquática
        ctx.fillStyle = '#0984e3';
        ctx.beginPath();
        ctx.moveTo(20, headY - 4);
        ctx.lineTo(16, headY - 8);
        ctx.lineTo(22, headY - 2);
        ctx.fill();

        // Olho dourado réptil com pupila em fenda
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(24, headY - 1.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(24, headY - 2.5, 1, 2);

        // Fangs brancos na mandíbula
        ctx.fillStyle = '#f5f6fa';
        ctx.fillRect(26, headY + 1.5, 1.5, 2);

        // Pequenas bolhas de água saindo da cauda
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 10 + Math.sin(sTime - 4) * 3, 1.5, 0, Math.PI * 2);
        ctx.arc(-3, 8 + Math.sin(sTime - 5) * 4, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'burrower': {
        // Inseto Escavador Subterrâneo: armadura de besouro em quitina, mandíbulas afiadas e patas articuladas
        const bWobble = Math.sin(t * 12) * 1.5;
        const pincerSwing = Math.sin(t * 10) * 3;

        // Patas insetoides articuladas
        ctx.strokeStyle = isHurt ? '#fff' : '#2d3436';
        ctx.lineWidth = 1.5;
        for (let leg = -1; leg <= 1; leg++) {
          const legPhase = Math.sin(t * 16 + leg * 2) * 3;
          // Pata inferior
          ctx.beginPath();
          ctx.moveTo(13 + leg * 5, 16);
          ctx.lineTo(13 + leg * 5 + legPhase, 21);
          ctx.lineTo(16 + leg * 5 + legPhase, 23);
          ctx.stroke();
        }

        // Carapaça de quitina bronze/cobre com placas segmentadas
        const chitinGrad = ctx.createLinearGradient(3, 5, 23, 19);
        chitinGrad.addColorStop(0, isHurt ? '#ffffff' : '#e67e22');
        chitinGrad.addColorStop(0.5, isHurt ? '#ff7675' : '#d35400');
        chitinGrad.addColorStop(1, isHurt ? '#d63031' : '#6d4c41');
        ctx.fillStyle = chitinGrad;
        ctx.beginPath();
        ctx.ellipse(12, 12 + bWobble, 10, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Linhas de segmentação da carapaça
        ctx.strokeStyle = isHurt ? '#fff' : '#4e342e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6, 12 + bWobble); ctx.lineTo(18, 12 + bWobble);
        ctx.moveTo(12, 5 + bWobble); ctx.lineTo(12, 19 + bWobble);
        ctx.stroke();

        // Placa da cabeça blindada
        ctx.fillStyle = isHurt ? '#fff' : '#a04000';
        ctx.beginPath();
        ctx.roundRect(17, 8 + bWobble, 7, 8, 3);
        ctx.fill();

        // Mandíbulas articuladas afiadas (tesouras escavadoras)
        ctx.fillStyle = isHurt ? '#fff' : '#2c3e50';
        ctx.beginPath();
        // Mandíbula superior
        ctx.moveTo(23, 9 + bWobble);
        ctx.lineTo(29, 6 + bWobble - pincerSwing);
        ctx.lineTo(27, 10 + bWobble);
        ctx.closePath();
        ctx.fill();

        // Mandíbula inferior
        ctx.beginPath();
        ctx.moveTo(23, 15 + bWobble);
        ctx.lineTo(29, 18 + bWobble + pincerSwing);
        ctx.lineTo(27, 14 + bWobble);
        ctx.closePath();
        ctx.fill();

        // Olhos compostos de rubi
        ctx.fillStyle = '#ff3838';
        ctx.fillRect(20, 9 + bWobble, 2.5, 2);
        ctx.fillRect(20, 13 + bWobble, 2.5, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(21, 9 + bWobble, 1, 1);
        ctx.fillRect(21, 13 + bWobble, 1, 1);

        // Pontos de terra grudados na carapaça
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(7, 8 + bWobble, 2, 2);
        ctx.fillRect(15, 15 + bWobble, 2, 2);
        break;
      }
    }

    // Barra de vida miniatura sobre inimigos comuns se feridos
    if (e.hp < e.maxHp) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, -9, e.width, 4);
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(0, -9, (e.hp / e.maxHp) * e.width, 4);
    }

    ctx.restore();
  }

  // --- Renderização Aprimorada dos Chefes ---

  drawBoss(ctx, boss) {
    ctx.save();
    ctx.translate(Math.round(boss.x), Math.round(boss.y));

    if (boss.facing === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-boss.width, 0);
    }

    const t = boss.animTime || 0;
    const bob = Math.sin(t * 4) * 4;

    if (boss.hurtTimer > 0) {
      ctx.filter = 'brightness(1.8)';
    }

    switch (boss.id) {
      case 'cragmor': {
        // Titã de Pedra Pétreo: granito basáltico, fendas de magma vulcânico e punhos colossais
        const magmaColor = boss.phase === 2 ? '#ff4757' : '#ffa502';

        // Sombra gigante
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(boss.width / 2, boss.height - 2, boss.width * 0.45, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo de blocos ciclópicos
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(8, 8 + bob, boss.width - 16, boss.height - 14);

        // Placas de rocha com relevo
        ctx.fillStyle = '#57606f';
        ctx.beginPath();
        ctx.roundRect(12, 12 + bob, boss.width - 24, boss.height - 22, 8);
        ctx.fill();

        // Fendas de magma vulcânico brilhante
        ctx.strokeStyle = magmaColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(16, 20 + bob); ctx.lineTo(26, 32 + bob); ctx.lineTo(18, 44 + bob);
        ctx.moveTo(boss.width - 18, 22 + bob); ctx.lineTo(boss.width - 28, 36 + bob);
        ctx.stroke();

        // Núcleo incandescente de energia mágica ancestral
        const coreGrad = ctx.createRadialGradient(
          boss.width / 2, boss.height / 2 + bob, 2,
          boss.width / 2, boss.height / 2 + bob, 16
        );
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, magmaColor);
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(boss.width / 2, boss.height / 2 + bob, 18, 0, Math.PI * 2);
        ctx.fill();

        // Braço gigante esmagador
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(boss.width - 18, 16 + bob, 24, 38);
        ctx.fillStyle = magmaColor;
        ctx.fillRect(boss.width - 12, 34 + bob, 16, 4);
        break;
      }

      case 'scylla': {
        // Serpente/Leviatã do Abismo: escamas abissais, crista neon e olhos luminosos
        ctx.fillStyle = '#0984e3';
        ctx.beginPath();
        ctx.ellipse(boss.width / 2, boss.height / 2 + bob, boss.width / 2 - 4, boss.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Crista dorsal bioluminescente reluzente
        ctx.fillStyle = '#00cec9';
        for (let i = 8; i < boss.width - 10; i += 14) {
          ctx.beginPath();
          ctx.moveTo(i, 14 + bob);
          ctx.lineTo(i + 7, -6 + bob);
          ctx.lineTo(i + 13, 14 + bob);
          ctx.fill();
        }

        // Olho ancestral radiante
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(boss.width - 18, boss.height / 2 - 6 + bob, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(boss.width - 18, boss.height / 2 - 7 + bob, 2.5, 2.5);
        break;
      }

      case 'zephyrion': {
        // Quimera Alada dos Ventos: asas de tempestade elétricas e penas celestes
        ctx.fillStyle = '#6c5ce7';
        ctx.beginPath();
        ctx.ellipse(boss.width / 2, boss.height / 2 + bob, boss.width / 2.2, boss.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Asas elétricas tempestuosas
        const wing = Math.sin(t * 12) * 20;
        ctx.fillStyle = '#a29bfe';
        ctx.beginPath();
        ctx.moveTo(boss.width / 2, 20);
        ctx.lineTo(-24, -12 + wing);
        ctx.lineTo(boss.width / 2, 42);
        ctx.lineTo(boss.width + 24, -12 + wing);
        ctx.fill();

        // Raios de vento
        ctx.strokeStyle = '#fdcb6e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, -4 + wing); ctx.lineTo(-8, 8 + wing);
        ctx.moveTo(boss.width + 16, -4 + wing); ctx.lineTo(boss.width + 8, 8 + wing);
        ctx.stroke();
        break;
      }

      case 'void_lord': {
        // O Senhor da Corrupção (Chefe Final): vórtice cósmico, máscara ancestral e trevas
        const vRadius = boss.width * 0.75 + Math.sin(t * 6) * 6;
        const vGrad = ctx.createRadialGradient(
          boss.width / 2, boss.height / 2, 8,
          boss.width / 2, boss.height / 2, vRadius
        );
        vGrad.addColorStop(0, 'rgba(108, 92, 231, 0.45)');
        vGrad.addColorStop(0.7, 'rgba(44, 44, 84, 0.25)');
        vGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = vGrad;
        ctx.beginPath();
        ctx.arc(boss.width / 2, boss.height / 2, vRadius, 0, Math.PI * 2);
        ctx.fill();

        // Corpo de trevas abissal
        ctx.fillStyle = '#0a0a14';
        ctx.beginPath();
        ctx.ellipse(boss.width / 2, boss.height / 2 + bob, 28, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        // Máscara ancestral dourada flutuante
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(boss.width / 2 - 13, boss.height / 2 - 22 + bob, 26, 30, 7);
        ctx.fill();

        // Olhos vazios cósmicos sinistros
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(boss.width / 2 - 9, boss.height / 2 - 14 + bob, 5, 5);
        ctx.fillRect(boss.width / 2 + 4, boss.height / 2 - 14 + bob, 5, 5);
        break;
      }
    }

    ctx.restore();
  }
}

// Instância global de renderização
const spriteRenderer = new SpriteRenderer();
