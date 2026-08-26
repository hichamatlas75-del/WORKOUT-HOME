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
      case 5: this.drawMountainClimber(ctx, w, h, time, floorY); break;
      case 6: this.drawGluteBridge(ctx, w, h, time, floorY); break;
      case 7: this.drawHipExtension(ctx, w, h, time, floorY); break;
      case 8: this.drawPlank(ctx, w, h, time, floorY); break;
      case 9: this.drawDynamicStretching(ctx, w, h, time, floorY); break;
      case 10: this.drawLunges(ctx, w, h, time, floorY); break;
      case 11: this.drawKneePushup(ctx, w, h, time, floorY); break;
      case 12: this.drawDiamondPushup(ctx, w, h, time, floorY); break;
      case 13: this.drawBurpee(ctx, w, h, time, floorY); break;
      case 14: this.drawRussianTwist(ctx, w, h, time, floorY); break;
      case 15: this.drawSidePlank(ctx, w, h, time, floorY); break;
      case 16: this.drawChairDips(ctx, w, h, time, floorY); break;
      case 17: this.drawBicycleCrunches(ctx, w, h, time, floorY); break;
      case 18: this.drawHighKnees(ctx, w, h, time, floorY); break;
      case 19: this.drawSuperman(ctx, w, h, time, floorY); break;
      case 20: this.drawWallSit(ctx, w, h, time, floorY); break;
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
  // 05. MOUNTAIN CLIMBERS (Mouvement Réel : Position planche & montées genoux dynamiques)
  // --------------------------------------------------------------------------
  drawMountainClimber(ctx, w, h, time, floorY) {
    const cycle = (time % 0.7) / 0.7; // 0.7s par cycle complet (rythmé et rapide)
    const legPhase = Math.sin(cycle * Math.PI * 2);

    const handsX = w * 0.68;
    const handsY = floorY - 4;
    const shoulderX = handsX - 4;
    const shoulderY = floorY - 46;

    const hipX = w * 0.44;
    const hipY = floorY - 36 + Math.abs(legPhase) * 3;

    const headX = shoulderX + 14;
    const headY = shoulderY - 6;

    // Jambe 1 (avant / arrière)
    const knee1T = (legPhase + 1) / 2;
    const knee1X = hipX + (knee1T * 26);
    const knee1Y = floorY - 24 - (knee1T * 8);
    const foot1X = hipX - 32 + (knee1T * 38);
    const foot1Y = floorY - 4 - (knee1T * 10);

    // Jambe 2 (en opposition)
    const knee2T = 1 - knee1T;
    const knee2X = hipX + (knee2T * 26);
    const knee2Y = floorY - 24 - (knee2T * 8);
    const foot2X = hipX - 32 + (knee2T * 38);
    const foot2Y = floorY - 4 - (knee2T * 10);

    // Bras tendus en appui solide
    this.drawLimb(ctx, shoulderX, shoulderY, handsX, handsY, 5.5, '#f8fafc');

    // Buste / Tronc gainé
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#f8fafc', 'rgba(16, 185, 129, 0.4)');

    // Jambe 2 (arrière-plan)
    this.drawLimb(ctx, hipX, hipY, knee2X, knee2Y, 5.5, '#64748b');
    this.drawLimb(ctx, knee2X, knee2Y, foot2X, foot2Y, 5, '#64748b');

    // Jambe 1 (premier plan en vert émeraude / actif)
    this.drawLimb(ctx, hipX, hipY, knee1X, knee1Y, 7, '#10b981', 'rgba(16, 185, 129, 0.7)');
    this.drawLimb(ctx, knee1X, knee1Y, foot1X, foot1Y, 5.5, '#10b981');

    this.drawHead(ctx, headX, headY, 8.5);
    this.drawJoint(ctx, handsX, handsY, 3.5, '#10b981');
    this.drawJoint(ctx, knee1X, knee1Y, 4, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 06. PONT FESSIER (Mouvement Réel : Montée pelvienne, contraction fessiers)
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
  // 07. EXTENSION DE HANCHE DEBOUT (Mouvement Réel : Balancier arrière contrôlé)
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
  // 08. GAINAGE PLANCHE CLASSIQUE (Mouvement Réel : Alignement parfait, respiration & vibration transverse)
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
    this.drawLimb(ctx, hipX, hipY, feetX, feetY, 7, '#f8fafc');

    this.drawHead(ctx, headX, headY, 8.5);
    this.drawJoint(ctx, elbowX, elbowY, 3.5, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 09. ÉTIREMENTS DYNAMIQUES (Mouvement Réel : Ouvertures amples & respirations)
  // -----------------------------------------------------------------------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // 10. FENTES ALTERNÉES (Lunges)
  // --------------------------------------------------------------------------
  drawLunges(ctx, w, h, time, floorY) {
    const cycle = (time % 2.4) / 2.4;
    const lungeProgress = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    const cx = w * 0.5;

    const hipY = floorY - 50 + (lungeProgress * 20);
    const shoulderY = hipY - 36;
    const headY = shoulderY - 14;

    // Jambe avant fléchie
    const frontKneeX = cx + 22;
    const frontKneeY = floorY - 20 + (lungeProgress * 5);
    const frontFootX = cx + 24;
    this.drawLimb(ctx, cx, hipY, frontKneeX, frontKneeY, 6.5, '#10b981', 'rgba(16, 185, 129, 0.4)');
    this.drawLimb(ctx, frontKneeX, frontKneeY, frontFootX, floorY - 4, 6, '#f8fafc');

    // Jambe arrière
    const backKneeX = cx - 24;
    const backKneeY = floorY - 12 - (lungeProgress * 2);
    const backFootX = cx - 36;
    this.drawLimb(ctx, cx, hipY, backKneeX, backKneeY, 6, '#f8fafc');
    this.drawLimb(ctx, backKneeX, backKneeY, backFootX, floorY - 4, 5.5, '#f8fafc');

    // Buste & Tête
    this.drawLimb(ctx, cx, shoulderY, cx, hipY, 8, '#f8fafc');
    this.drawHead(ctx, cx, headY, 9);
    // Bras en garde équilibre
    this.drawLimb(ctx, cx, shoulderY + 4, cx + 12, shoulderY + 16, 4.5, '#10b981');
  }

  // --------------------------------------------------------------------------
  // 11. POMPES SUR LES GENOUX (Knee Push-ups)
  // --------------------------------------------------------------------------
  drawKneePushup(ctx, w, h, time, floorY) {
    const cycle = (time % 2.0) / 2.0;
    const push = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    const cx = w * 0.5;

    const handX = cx - 25;
    const handY = floorY - 4;
    const kneeX = cx + 38;
    const kneeY = floorY - 4;

    const shoulderY = floorY - 32 + (push * 16);
    const shoulderX = handX;
    const hipY = floorY - 22 + (push * 10);
    const hipX = kneeX - 28;

    this.drawLimb(ctx, handX, handY, shoulderX, shoulderY, 5.5, '#10b981', 'rgba(16, 185, 129, 0.4)');
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 7.5, '#f8fafc');
    this.drawLimb(ctx, hipX, hipY, kneeX, kneeY, 6.5, '#f8fafc');
    // Pieds relevés derrière
    this.drawLimb(ctx, kneeX, kneeY, kneeX + 16, floorY - 20, 5, '#94a3b8');
    this.drawHead(ctx, shoulderX - 12, shoulderY - 8, 8.5);
  }

  // --------------------------------------------------------------------------
  // 12. POMPES DIAMANT (Diamond Push-ups)
  // --------------------------------------------------------------------------
  drawDiamondPushup(ctx, w, h, time, floorY) {
    const cycle = (time % 1.8) / 1.8;
    const push = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    const cx = w * 0.5;

    const handX = cx - 20;
    const handY = floorY - 4;
    const feetX = cx + 55;
    const feetY = floorY - 4;

    const shoulderY = floorY - 36 + (push * 20);
    const shoulderX = handX;
    const hipY = floorY - 24 + (push * 12);
    const hipX = cx + 15;

    // Bras rapprochés diamond
    this.drawLimb(ctx, handX, handY, shoulderX, shoulderY, 5.5, '#f43f5e', 'rgba(244, 63, 94, 0.6)');
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#f43f5e', 'rgba(244, 63, 94, 0.4)');
    this.drawLimb(ctx, hipX, hipY, feetX, feetY, 6.5, '#f8fafc');
    this.drawHead(ctx, shoulderX - 14, shoulderY - 10, 8.5);
  }

  // --------------------------------------------------------------------------
  // 13. BURPEES (Cardio Explosif)
  // --------------------------------------------------------------------------
  drawBurpee(ctx, w, h, time, floorY) {
    const phase = (time % 2.8) / 2.8; // 0..1
    const cx = w * 0.5;

    if (phase < 0.35) {
      // Phase saut vertical
      const jumpY = Math.sin((phase / 0.35) * Math.PI) * 35;
      const hipY = floorY - 65 - jumpY;
      const shoulderY = hipY - 35;
      this.drawLimb(ctx, cx, hipY, cx - 10, floorY - 10 - jumpY, 6, '#f43f5e', 'rgba(244, 63, 94, 0.6)');
      this.drawLimb(ctx, cx, hipY, cx + 10, floorY - 10 - jumpY, 6, '#f43f5e');
      this.drawLimb(ctx, cx, shoulderY, cx, hipY, 8, '#f43f5e');
      this.drawLimb(ctx, cx, shoulderY, cx - 18, shoulderY - 25, 5, '#f43f5e');
      this.drawLimb(ctx, cx, shoulderY, cx + 18, shoulderY - 25, 5, '#f43f5e');
      this.drawHead(ctx, cx, shoulderY - 14, 9, '#f43f5e');
    } else {
      // Phase planche basse / squat
      const plankTime = (phase - 0.35) / 0.65;
      const handX = cx - 25;
      const feetX = cx + 45;
      const shoulderY = floorY - 28;
      const hipY = floorY - 22;
      this.drawLimb(ctx, handX, floorY - 4, handX, shoulderY, 5.5, '#f43f5e');
      this.drawLimb(ctx, handX, shoulderY, cx + 10, hipY, 7.5, '#f43f5e');
      this.drawLimb(ctx, cx + 10, hipY, feetX, floorY - 4, 6.5, '#f8fafc');
      this.drawHead(ctx, handX - 12, shoulderY - 8, 8.5);
    }
  }

  // --------------------------------------------------------------------------
  // 14. RUSSIAN TWISTS (Rotation Obliques)
  // --------------------------------------------------------------------------
  drawRussianTwist(ctx, w, h, time, floorY) {
    const cycle = Math.sin(time * 3);
    const cx = w * 0.5;

    const hipX = cx;
    const hipY = floorY - 18;
    const shoulderX = cx - 18;
    const shoulderY = floorY - 48;
    const headX = shoulderX - 8;
    const headY = shoulderY - 12;

    // Pieds décollés
    const kneeX = cx + 22;
    const kneeY = floorY - 32;
    const feetX = cx + 42;
    const feetY = floorY - 36;

    this.drawLimb(ctx, hipX, hipY, kneeX, kneeY, 6, '#f8fafc');
    this.drawLimb(ctx, kneeX, kneeY, feetX, feetY, 5.5, '#f8fafc');
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#38bdf8', 'rgba(56, 189, 248, 0.6)');

    // Bras en rotation
    const handX = cx + (cycle * 22);
    const handY = floorY - 26;
    this.drawLimb(ctx, shoulderX, shoulderY, handX, handY, 5, '#38bdf8', 'rgba(56, 189, 248, 0.5)');
    this.drawHead(ctx, headX, headY, 8.5);
  }

  // --------------------------------------------------------------------------
  // 15. GAINAGE LATÉRAL (Side Plank)
  // --------------------------------------------------------------------------
  drawSidePlank(ctx, w, h, time, floorY) {
    const cx = w * 0.5;
    const elbowX = cx - 35;
    const elbowY = floorY - 4;
    const shoulderX = elbowX;
    const shoulderY = floorY - 38;
    const hipX = cx + 5;
    const hipY = floorY - 28;
    const feetX = cx + 50;
    const feetY = floorY - 4;

    this.drawLimb(ctx, elbowX, elbowY, shoulderX, shoulderY, 6, '#10b981');
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 8, '#10b981', 'rgba(16, 185, 129, 0.5)');
    this.drawLimb(ctx, hipX, hipY, feetX, feetY, 6.5, '#f8fafc');
    // Bras supérieur levé
    this.drawLimb(ctx, shoulderX, shoulderY, shoulderX, shoulderY - 28, 5, '#10b981', 'rgba(16, 185, 129, 0.4)');
    this.drawHead(ctx, shoulderX - 12, shoulderY - 8, 8.5);
  }

  // --------------------------------------------------------------------------
  // 16. DIPS SUR CHAISE
  // --------------------------------------------------------------------------
  drawChairDips(ctx, w, h, time, floorY) {
    const cycle = (time % 2.0) / 2.0;
    const dip = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    const cx = w * 0.5;

    const chairX = cx + 25;
    const chairY = floorY - 38;
    // Dessin chaise
    this.drawLimb(ctx, chairX, floorY - 4, chairX, chairY, 4, '#475569');
    this.drawLimb(ctx, chairX - 10, chairY, chairX + 15, chairY, 5, '#475569');

    const handX = chairX - 5;
    const handY = chairY;
    const hipX = cx - 5;
    const hipY = floorY - 32 + (dip * 16);
    const shoulderX = hipX;
    const shoulderY = hipY - 32;

    this.drawLimb(ctx, handX, handY, shoulderX, shoulderY, 5.5, '#a855f7', 'rgba(168, 85, 247, 0.6)');
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 7.5, '#a855f7');
    // Jambes avancées fléchies
    this.drawLimb(ctx, hipX, hipY, cx - 25, floorY - 4, 6, '#f8fafc');
    this.drawHead(ctx, shoulderX, shoulderY - 12, 8.5);
  }

  // --------------------------------------------------------------------------
  // 17. BICYCLE CRUNCHES
  // --------------------------------------------------------------------------
  drawBicycleCrunches(ctx, w, h, time, floorY) {
    const cycle = Math.sin(time * 3.5);
    const cx = w * 0.5;

    const hipX = cx - 10;
    const hipY = floorY - 10;
    const shoulderX = cx - 35;
    const shoulderY = floorY - 22;

    // Jambe gauche vs droite pédalage
    const leg1X = cx + 15 + (cycle * 18);
    const leg1Y = floorY - 25;
    const leg2X = cx + 38 - (cycle * 18);
    const leg2Y = floorY - 12;

    this.drawLimb(ctx, hipX, hipY, leg1X, leg1Y, 6, '#38bdf8', 'rgba(56, 189, 248, 0.5)');
    this.drawLimb(ctx, hipX, hipY, leg2X, leg2Y, 6, '#f8fafc');
    this.drawLimb(ctx, shoulderX, shoulderY, hipX, hipY, 7.5, '#38bdf8');
    this.drawHead(ctx, shoulderX - 10, shoulderY - 6, 8.5);
  }

  // --------------------------------------------------------------------------
  // 18. MONTÉES DE GENOUX (High Knees)
  // --------------------------------------------------------------------------
  drawHighKnees(ctx, w, h, time, floorY) {
    const cycle = Math.sin(time * 6);
    const cx = w * 0.5;

    const hipY = floorY - 65;
    const shoulderY = hipY - 36;

    // Alternance genou haut
    const knee1Y = cycle > 0 ? (hipY + 5 - (cycle * 22)) : (floorY - 28);
    const knee2Y = cycle < 0 ? (hipY + 5 - (Math.abs(cycle) * 22)) : (floorY - 28);

    this.drawLimb(ctx, cx, hipY, cx - 10, knee1Y, 6, '#10b981', 'rgba(16, 185, 129, 0.5)');
    this.drawLimb(ctx, cx - 10, knee1Y, cx - 8, floorY - 4, 5.5, '#f8fafc');
    this.drawLimb(ctx, cx, hipY, cx + 10, knee2Y, 6, '#10b981', 'rgba(16, 185, 129, 0.5)');
    this.drawLimb(ctx, cx + 10, knee2Y, cx + 8, floorY - 4, 5.5, '#f8fafc');

    this.drawLimb(ctx, cx, shoulderY, cx, hipY, 8, '#f8fafc');
    this.drawHead(ctx, cx, shoulderY - 14, 9);
  }

  // --------------------------------------------------------------------------
  // 19. SUPERMAN (Extension lombaire)
  // --------------------------------------------------------------------------
  drawSuperman(ctx, w, h, time, floorY) {
    const cycle = (time % 2.4) / 2.4;
    const lift = (1 - Math.cos(cycle * Math.PI * 2)) / 2;
    const cx = w * 0.5;

    const hipX = cx;
    const hipY = floorY - 8;
    const chestX = cx - 25;
    const chestY = floorY - 8 - (lift * 16);
    const feetX = cx + 38;
    const feetY = floorY - 8 - (lift * 14);

    this.drawLimb(ctx, chestX, chestY, hipX, hipY, 8, '#38bdf8', 'rgba(56, 189, 248, 0.5)');
    this.drawLimb(ctx, hipX, hipY, feetX, feetY, 6, '#38bdf8');
    // Bras tendus devant levés
    this.drawLimb(ctx, chestX, chestY, chestX - 25, chestY - 10, 5, '#38bdf8');
    this.drawHead(ctx, chestX - 10, chestY - 8, 8.5);
  }

  // --------------------------------------------------------------------------
  // 20. CHAISE AU MUR (Wall Sit)
  // --------------------------------------------------------------------------
  drawWallSit(ctx, w, h, time, floorY) {
    const cx = w * 0.5;
    const wallX = cx - 25;

    // Mur
    this.drawLimb(ctx, wallX, floorY - 4, wallX, floorY - 85, 4, '#475569');

    const hipX = wallX;
    const hipY = floorY - 42;
    const kneeX = cx + 8;
    const kneeY = floorY - 42;
    const footX = kneeX;
    const footY = floorY - 4;

    // Buste plaqué
    this.drawLimb(ctx, wallX, floorY - 75, hipX, hipY, 8, '#10b981', 'rgba(16, 185, 129, 0.5)');
    // Cuisses horizontales à 90°
    this.drawLimb(ctx, hipX, hipY, kneeX, kneeY, 7, '#10b981', 'rgba(16, 185, 129, 0.6)');
    // Tibias verticaux
    this.drawLimb(ctx, kneeX, kneeY, footX, footY, 6.5, '#f8fafc');
    this.drawHead(ctx, wallX, floorY - 85, 9);
  }
}

window.motionPlayer = new MotionPlayer();
