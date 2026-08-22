/**
 * FULL BODY 17 — MOTEUR DE MOUVEMENT RÉEL EN TEMPS RÉEL (CANVAS 60 FPS)
 * Animation biomécanique articulée des 8 exercices simulant le mouvement physique complet.
 */

class MotionPlayer {
  constructor() {
    this.animationId = null;
    this.canvas = null;
    this.ctx = null;
    this.currentExId = 1;
    this.startTime = performance.now();
    this.speedMultiplier = 1.0;
    this.repCount = 0;
    this.lastRepCycle = 0;
  }

  // Initialisation du canvas d'animation réelle
  init(canvasElement, exerciseId = 1) {
    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.canvas = canvasElement;
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.currentExId = exerciseId;
    this.startTime = performance.now();
    this.repCount = 0;
    this.lastRepCycle = 0;

    // Définir la résolution haute définition
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const height = rect.height || 180;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    this.renderWidth = width;
    this.renderHeight = height;

    this.animate();
  }

  setExercise(exerciseId) {
    this.currentExId = exerciseId;
    this.startTime = performance.now();
    this.repCount = 0;
    this.lastRepCycle = 0;
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animate() {
    const now = performance.now();
    const elapsed = (now - this.startTime) / 1000 * this.speedMultiplier;

    this.renderFrame(elapsed);
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  // Rendu de la scène
  renderFrame(time) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.renderWidth;
    const h = this.renderHeight;

    ctx.clearRect(0, 0, w, h);

    // 1. Fond studio sombre dégradé
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0b111e');
    bgGrad.addColorStop(1, '#030712');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Grille de sol studio avec perspective
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const floorY = h * 0.82;

    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // 3. Ombre portée dynamique sous l'athlète
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, floorY + 4, 65, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Rendu du mouvement biomécanique selon l'exercice
    switch (this.currentExId) {
      case 1: this.drawJumpingJack(ctx, w, h, time, floorY); break;
      case 2: this.drawSquat(ctx, w, h, time, floorY); break;
      case 3: this.drawPushup(ctx, w, h, time, floorY); break;
      case 4: this.drawCrunchScissor(ctx, w, h, time, floorY); break;
      case 5: this.drawGluteBridge(ctx, w, h, time, floorY); break;
      case 6: this.drawHipExtension(ctx, w, h, time, floorY); break;
      case 7: this.drawPlank(ctx, w, h, time, floorY); break;
      case 8: this.drawDynamicStretching(ctx, w, h, time, floorY); break;
      default: this.drawSquat(ctx, w, h, time, floorY);
    }
  }

  // --- OUTILS DE DESSIN ANATOMIQUE SHADÉ ---
  drawLimb(ctx, x1, y1, x2, y2, width, color = '#f8fafc', glowColor = null) {
    ctx.save();
    if (glowColor) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 14;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  drawJoint(ctx, x, y, radius, color = '#10b981') {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawHead(ctx, x, y, radius = 9, color = '#10b981') {
    this.drawJoint(ctx, x, y, radius, color);
    // Masque regard
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 3, y - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --------------------------------------------------------------------------
  // 01. JUMPING JACK (Mouvement Réel : Sauts, ouverture bras & jambes)
  // --------------------------------------------------------------------------
  drawJumpingJack(ctx, w, h, time, floorY) {
    const cycle = (time % 1.1) / 1.1; // 1.1s par saut
    const openFactor = Math.sin(cycle * Math.PI); // 0 (fermé) -> 1 (ouvert) -> 0

    const cx = w * 0.5;
    const jumpY = floorY - 100 - (openFactor * 14);

    const headX = cx;
    const headY = jumpY;
    const shoulderY = headY + 16;
    const hipY = headY + 54;

    // Bras (Abduction réelle 0° à 140°)
    const armAngle = openFactor * 2.4; // radians
    const armLen = 32;

    const leftHandX = cx - Math.cos(armAngle) * armLen - (openFactor * 10);
    const leftHandY = shoulderY - Math.sin(armAngle) * armLen;
    const rightHandX = cx + Math.cos(armAngle) * armLen + (openFactor * 10);
    const rightHandY = shoulderY - Math.sin(armAngle) * armLen;

    // Jambes (Écartement réel 0 à 38px)
    const legSpread = openFactor * 32;
    const footY = floorY - (openFactor * 8);

    // Dessin Tronc
    this.drawLimb(ctx, cx, shoulderY, cx, hipY, 9, '#f8fafc', '#10b981');

    // Bras
    this.drawLimb(ctx, cx - 6, shoulderY, leftHandX, leftHandY, 5, '#10b981', 'rgba(16,185,129,0.4)');
    this.drawLimb(ctx, cx + 6, shoulderY, rightHandX, rightHandY, 5, '#10b981', 'rgba(16,185,129,0.4)');

    // Jambes
    this.drawLimb(ctx, cx - 4, hipY, cx - 12 - legSpread, footY, 6, '#10b981', 'rgba(16,185,129,0.5)');
    this.drawLimb(ctx, cx + 4, hipY, cx + 12 + legSpread, footY, 6, '#10b981', 'rgba(16,185,129,0.5)');

    // Tête
    this.drawHead(ctx, headX, headY, 9);
  }

  // --------------------------------------------------------------------------
  // 02. SQUAT LIBRE (Mouvement Réel : Flexion genoux 90°, hanches arrière, bras avant)
  // --------------------------------------------------------------------------
  drawSquat(ctx, w, h, time, floorY) {
    const cycle = (time % 2.8) / 2.8;
    // Courbe d'aller-retour fluide (0 = debout, 1 = squat profond)
    const depth = (1 - Math.cos(cycle * Math.PI * 2)) / 2;

    const cx = w * 0.5 - 10;
    const footX = cx + 10;
    const footY = floorY - 4;

    // Calcul de la cinématique inverse du squat
    const hipDrop = depth * 34;
    const hipX = cx - (depth * 24);
    const hipY = floorY - 65 + hipDrop;

    const kneeX = cx + 18 - (depth * 4);
    const kneeY = floorY - 32 + (hipDrop * 0.5);

    const shoulderX = hipX + 10 + (depth * 14);
    const shoulderY = hipY - 40 + (depth * 6);
    const headX = shoulderX + 4;
    const headY = shoulderY - 14;

    // Bras tendus vers l'avant pour équilibre
    const handX = shoulderX + 36;
    const handY = shoulderY + (depth * 4);

    // Dessin Bras
    this.drawLimb(ctx, shoulderX, shoulderY, handX, handY, 4.5, '#94a3b8');

    // Dessin Tronc & Dos Droit
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#f8fafc');

    // Cuisses (Quadriceps & Fessiers en surbrillance émeraude)
    this.drawLimb(ctx, hipX, hipY, kneeX, kneeY, 7.5, '#10b981', 'rgba(16, 185, 129, 0.65)');
    // Mollets
    this.drawLimb(ctx, kneeX, kneeY, footX, footY, 6, '#f8fafc');

    // Tête
    this.drawHead(ctx, headX, headY, 9);
    // Articulation genou
    this.drawJoint(ctx, kneeX, kneeY, 4, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 03. POMPES AU SOL (Mouvement Réel : Flexion coudes 45°, descente poitrine)
  // --------------------------------------------------------------------------
  drawPushup(ctx, w, h, time, floorY) {
    const cycle = (time % 2.4) / 2.4;
    const depth = (1 - Math.cos(cycle * Math.PI * 2)) / 2; // 0 = haut, 1 = bas (poitrine sol)

    const feetX = w * 0.28;
    const feetY = floorY - 8;

    const handX = w * 0.65;
    const handY = floorY - 4;

    // Corps en planche rigide qui descend vers le sol
    const dropY = depth * 22;
    const shoulderX = handX - 4;
    const shoulderY = floorY - 44 + dropY;

    const hipX = w * 0.44;
    const hipY = floorY - 26 + (dropY * 0.65);

    const headX = shoulderX + 14;
    const headY = shoulderY - 4;

    // Coude plié
    const elbowX = handX - 14 - (depth * 10);
    const elbowY = shoulderY + 12;

    // Bras (Pectoraux/Triceps en surbrillance)
    this.drawLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, 5, '#10b981', 'rgba(16, 185, 129, 0.55)');
    this.drawLimb(ctx, elbowX, elbowY, handX, handY, 5, '#10b981', 'rgba(16, 185, 129, 0.55)');

    // Corps / Planche
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#f8fafc', 'rgba(16, 185, 129, 0.4)');
    this.drawLimb(ctx, hipX, hipY, feetX, feetY, 6.5, '#f8fafc');

    this.drawHead(ctx, headX, headY, 8);
    this.drawJoint(ctx, elbowX, elbowY, 3.5, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 04. CRUNCH & SCISSOR KICKS (Mouvement Réel : Enroulement buste & battements ciseaux)
  // --------------------------------------------------------------------------
  drawCrunchScissor(ctx, w, h, time, floorY) {
    const curlCycle = (1 - Math.cos(time * Math.PI * 1.5)) / 2;
    const scissorCycle = Math.sin(time * Math.PI * 3.5);

    const hipX = w * 0.42;
    const hipY = floorY - 12;

    // Enroulement du haut du dos (Crunch)
    const shoulderX = hipX - 32;
    const shoulderY = hipY - 14 - (curlCycle * 14);
    const headX = shoulderX - 10;
    const headY = shoulderY - 8;

    // Mains derrière la nuque
    this.drawLimb(ctx, shoulderX, shoulderY, headX + 4, headY - 4, 4, '#94a3b8');

    // Buste
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#10b981', 'rgba(16, 185, 129, 0.6)');

    // Jambe 1 (Battement haut/bas)
    const leg1Angle = scissorCycle * 18;
    const knee1X = hipX + 32;
    const knee1Y = hipY - 12 + leg1Angle;
    const foot1X = knee1X + 36;
    const foot1Y = knee1Y - 6 + leg1Angle;

    // Jambe 2 (Battement inversé)
    const leg2Angle = -scissorCycle * 18;
    const knee2X = hipX + 30;
    const knee2Y = hipY - 12 + leg2Angle;
    const foot2X = knee2X + 36;
    const foot2Y = knee2Y - 6 + leg2Angle;

    this.drawLimb(ctx, hipX, hipY, knee2X, knee2Y, 5, 'rgba(16,185,129,0.5)');
    this.drawLimb(ctx, knee2X, knee2Y, foot2X, foot2Y, 4.5, 'rgba(16,185,129,0.5)');

    this.drawLimb(ctx, hipX, hipY, knee1X, knee1Y, 6, '#10b981', 'rgba(16, 185, 129, 0.6)');
    this.drawLimb(ctx, knee1X, knee1Y, foot1X, foot1Y, 5.5, '#10b981', 'rgba(16, 185, 129, 0.6)');

    this.drawHead(ctx, headX, headY, 8);
  }

  // --------------------------------------------------------------------------
  // 05. PONT FESSIER (Mouvement Réel : Montée pelvienne, contraction fessiers)
  // --------------------------------------------------------------------------
  drawGluteBridge(ctx, w, h, time, floorY) {
    const cycle = (time % 2.6) / 2.6;
    const lift = (1 - Math.cos(cycle * Math.PI * 2)) / 2; // 0 = bas, 1 = haut

    const shoulderX = w * 0.32;
    const shoulderY = floorY - 10;
    const headX = shoulderX - 14;
    const headY = floorY - 8;

    const feetX = w * 0.70;
    const feetY = floorY - 6;

    // Montée du bassin
    const hipLiftY = lift * 32;
    const hipX = w * 0.50;
    const hipY = floorY - 12 - hipLiftY;

    const kneeX = w * 0.64;
    const kneeY = floorY - 34 - (hipLiftY * 0.25);

    // Bras au sol
    this.drawLimb(ctx, shoulderX, shoulderY, shoulderX + 32, shoulderY, 4, '#94a3b8');

    // Buste & Hanches (Contraction fessiers en vert émeraude)
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#f8fafc');
    this.drawLimb(ctx, hipX, hipY, kneeX, kneeY, 7.5, '#10b981', 'rgba(16, 185, 129, 0.7)');
    this.drawLimb(ctx, kneeX, kneeY, feetX, feetY, 6, '#f8fafc');

    this.drawHead(ctx, headX, headY, 8);
    this.drawJoint(ctx, hipX, hipY, 4, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 06. EXTENSION DE HANCHE DEBOUT (Mouvement Réel : Balancier arrière contrôlé)
  // --------------------------------------------------------------------------
  drawHipExtension(ctx, w, h, time, floorY) {
    const cycle = (time % 2.4) / 2.4;
    const ext = (1 - Math.cos(cycle * Math.PI * 2)) / 2; // 0 = neutre, 1 = extension arrière

    const cx = w * 0.54;
    const standFootX = cx;
    const standFootY = floorY - 4;

    const hipX = cx;
    const hipY = floorY - 68;

    const shoulderX = cx + 2;
    const shoulderY = hipY - 38;
    const headX = shoulderX + 2;
    const headY = shoulderY - 14;

    // Jambe d'appui verticale
    this.drawLimb(ctx, hipX, hipY, standFootX, standFootY, 6, '#f8fafc');

    // Jambe en extension arrière
    const extAngle = ext * 0.65; // radians
    const backKneeX = hipX - Math.sin(extAngle) * 32;
    const backKneeY = hipY + Math.cos(extAngle) * 32;
    const backFootX = backKneeX - Math.sin(extAngle) * 32;
    const backFootY = backKneeY + Math.cos(extAngle) * 32;

    this.drawLimb(ctx, hipX, hipY, backKneeX, backKneeY, 7, '#10b981', 'rgba(16, 185, 129, 0.65)');
    this.drawLimb(ctx, backKneeX, backKneeY, backFootX, backFootY, 5.5, '#10b981', 'rgba(16, 185, 129, 0.65)');

    // Buste vertical
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#f8fafc');
    // Bras en équilibre
    this.drawLimb(ctx, shoulderX, shoulderY, shoulderX + 16, shoulderY + 22, 4.5, '#94a3b8');

    this.drawHead(ctx, headX, headY, 9);
    this.drawJoint(ctx, hipX, hipY, 4, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 07. GAINAGE PLANCHE CLASSIQUE (Mouvement Réel : Alignement parfait, respiration & vibration transverse)
  // --------------------------------------------------------------------------
  drawPlank(ctx, w, h, time, floorY) {
    const breathe = Math.sin(time * Math.PI * 1.8) * 2;
    const pulseGlow = (1 + Math.sin(time * Math.PI * 3.5)) * 0.15;

    const feetX = w * 0.26;
    const feetY = floorY - 8;

    const elbowX = w * 0.68;
    const elbowY = floorY - 6;

    const shoulderX = elbowX;
    const shoulderY = floorY - 32 + breathe;

    const hipX = w * 0.46;
    const hipY = floorY - 26 + (breathe * 0.6);

    const headX = shoulderX + 14;
    const headY = shoulderY - 2;

    // Avant-bras à 90° au sol
    this.drawLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, 5, '#10b981', 'rgba(16, 185, 129, 0.4)');
    this.drawLimb(ctx, elbowX, elbowY, elbowX + 18, elbowY, 5, '#10b981');

    // Planche abdominale (Glow abdominal intense)
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8.5, '#10b981', `rgba(16, 185, 129, ${0.6 + pulseGlow})`);
    this.drawLimb(ctx, hipX, hipY, feetX, feetY, 6.5, '#f8fafc');

    this.drawHead(ctx, headX, headY, 8);
    this.drawJoint(ctx, hipX, hipY, 4, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 08. ÉTIREMENTS DYNAMIQUES (Mouvement Réel : Grande ouverture des bras & cage thoracique)
  // --------------------------------------------------------------------------
  drawDynamicStretching(ctx, w, h, time, floorY) {
    const cycle = (time % 3.6) / 3.6;
    const expand = (1 - Math.cos(cycle * Math.PI * 2)) / 2; // 0 = bras le long du corps, 1 = grands bras ouverts

    const cx = w * 0.5;
    const hipX = cx;
    const hipY = floorY - 68;

    const shoulderX = cx;
    const shoulderY = hipY - 38;
    const headX = cx;
    const headY = shoulderY - 14 - (expand * 4);

    // Grands bras en ouverture circulaire
    const armAngle = 0.4 + (expand * 1.8);
    const armLen = 38;

    const leftX = shoulderX - Math.cos(armAngle) * armLen - (expand * 10);
    const leftY = shoulderY - Math.sin(armAngle) * armLen;
    const rightX = shoulderX + Math.cos(armAngle) * armLen + (expand * 10);
    const rightY = shoulderY - Math.sin(armAngle) * armLen;

    // Jambes stables
    this.drawLimb(ctx, hipX, hipY, cx - 18, floorY - 4, 6, '#f8fafc');
    this.drawLimb(ctx, hipX, hipY, cx + 18, floorY - 4, 6, '#f8fafc');

    // Buste
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#06b6d4', 'rgba(6, 182, 212, 0.6)');

    // Bras
    this.drawLimb(ctx, shoulderX - 4, shoulderY, leftX, leftY, 5, '#06b6d4', 'rgba(6, 182, 212, 0.5)');
    this.drawLimb(ctx, shoulderX + 4, shoulderY, rightX, rightY, 5, '#06b6d4', 'rgba(6, 182, 212, 0.5)');

    this.drawHead(ctx, headX, headY, 9, '#06b6d4');
  }
}

window.motionPlayer = new MotionPlayer();
