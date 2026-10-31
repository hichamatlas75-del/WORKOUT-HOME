/**
 * FULL BODY 17 — ENTRAÎNEMENT SPÉCIAL 2 HALTÈRES (FULL BODY & CORE)
 * Structure de données, Composants UI et Gestionnaire Interactif de Séance.
 * 5 Blocs en supersets (Haut/Bas du corps) + 1 Circuit d'isolation Abdominaux.
 */

const DUMBBELL_WORKOUT_DATA = {
  id: "workout_dumbbells_fullbody_core",
  title: "Full Body & Core avec 2 Haltères",
  subtitle: "Prise de masse & renforcement complet à domicile",
  goal: "Hypertrophie & Renforcement Fonctionnel",
  estimatedDuration: "35-45 min",
  recommendedRounds: 3, // 3 séries (intermédiaire) à 4 séries (avancé)
  difficulty: "Intermédiaire / Avancé",
  equipmentList: [
    { id: "2_dumbbells", name: "2 Haltères", icon: "🏋️‍♂️", desc: "Poids modéré à lourd (ex: 8 à 15 kg/haltère)" },
    { id: "1_dumbbell", name: "1 Haltère", icon: "🏋️", desc: "Pour les extensions triceps et le Russian twist" },
    { id: "mat", name: "Tapis ou Sol", icon: "🧘", desc: "Pour le développé couché et le circuit abdos" },
    { id: "chair_bench", name: "Chaise ou Banc", icon: "🪑", desc: "Pour surélever le pied arrière sur les fentes" },
    { id: "bodyweight", name: "Poids du corps", icon: "🤸", desc: "Pour les pompes diamant et le gainage" }
  ],
  blocks: [
    {
      blockId: 1,
      name: "BLOC 1 : Pectoraux & Dos",
      category: "upper_antagonist",
      type: "superset",
      typeLabel: "⚡ SUPERSET ANTAGONISTE",
      targetSummary: "Pectoraux, Grand Dorsal, Triceps",
      accentColor: "#3b82f6",
      roundsRecommended: "3 à 4 séries",
      restSeconds: 60,
      restLabel: "60s de repos après le superset",
      supersetTip: "Enchaînez l'exercice 1A et l'exercice 1B sans temps de repos intermédiaire. Prenez 60s avant d'attaquer la série suivante.",
      exercises: [
        {
          id: "db_1a",
          code: "1A",
          name: "Développé Couché Alterné aux Haltères",
          icon: "🏋️‍♂️",
          categoryTag: "Pectoraux & Triceps",
          badgeClass: "badge-blue",
          equipment: "2 Haltères + Tapis ou Banc",
          equipmentIcon: "🏋️‍♂️",
          summary: "Développé unilatéral au sol ou sur banc pour recruter les pectoraux et le gainage anti-rotation.",
          instructions: "Allongé sur le dos (sur banc ou au sol en Floor Press), omoplates plaquées et pieds bien ancrés. Poussez les deux haltères vers le plafond. Tout en maintenant un bras verrouillé en haut, descendez l'autre haltère sous contrôle jusqu'à ce que le bras forme un angle de 45° avec le buste, puis remontez en poussant fort. Alternez immédiatement avec le côté opposé.",
          formCues: [
            "Gardez les coudes rentrés à 45° par rapport au torse (ne pas écarter à 90° pour protéger la coiffe des rotateurs).",
            "Maintenez une contraction active des abdominaux pour empêcher le torse de pivoter d'un côté.",
            "Tempo recommandé : 2 secondes de descente contrôlée, 1 seconde de poussée dynamique."
          ],
          breathing: "Inspirez lors de la descente de l'haltère, expirez puissamment pendant la poussée.",
          series: "3 à 4 séries",
          reps: "10 à 12 réps par bras",
          rest: "0s (Enchaînement direct vers 1B)"
        },
        {
          id: "db_1b",
          code: "1B",
          name: "Rowing Buste Penché aux 2 Haltères",
          icon: "🚣‍♂️",
          categoryTag: "Grand Dorsal & Dos",
          badgeClass: "badge-cyan",
          equipment: "2 Haltères",
          equipmentIcon: "🏋️‍♂️",
          summary: "Tirage buste penché en prise neutre pour élargir le dos et renforcer les rotateurs de l'omoplate.",
          instructions: "Debout, pieds écartés de la largeur des épaules, genoux légèrement fléchis. Basculez les hanches vers l'arrière en penchant le buste à environ 45°, dos rigoureusement droit et nuque neutre. Les haltères pendent bras tendus. Tirez simultanément les coudes vers l'arrière et le haut en resserrant les omoplates, puis retenez la descente.",
          formCues: [
            "Imaginez que vous voulez toucher vos hanches avec vos coudes, sans tirer uniquement avec les bras.",
            "Gardez la poitrine sortie et les épaules basses, loin des oreilles.",
            "Ne donnez aucun à-coup de rein : le torse reste totalement immobile."
          ],
          breathing: "Expirez en tirant les coudes vers l'arrière, inspirez en redescendant les haltères avec retenue.",
          series: "3 à 4 séries",
          reps: "10 à 12 répétitions",
          rest: "60 secondes de repos"
        }
      ]
    },
    {
      blockId: 2,
      name: "BLOC 2 : Triceps",
      category: "arms_triceps",
      type: "superset",
      typeLabel: "⚡ SUPERSET BRÛLAGE",
      targetSummary: "Triceps (Chef long, latéral et médial)",
      accentColor: "#8b5cf6",
      roundsRecommended: "3 à 4 séries",
      restSeconds: 60,
      restLabel: "60s de repos après le superset",
      supersetTip: "L'extension verticale étire au maximum le chef long du triceps, puis les pompes diamant achèvent la congestion jusqu'à l'échec.",
      exercises: [
        {
          id: "db_2a",
          code: "2A",
          name: "Relevé Triceps au-dessus de la tête (Extension verticale)",
          icon: "⚡",
          categoryTag: "Triceps (Chef Long)",
          badgeClass: "badge-purple",
          equipment: "1 ou 2 Haltères",
          equipmentIcon: "🏋️",
          summary: "Extension au-dessus de la tête pour cibler la portion longue du triceps grâce à un étirement profond.",
          instructions: "Debout ou assis, abdominaux et fessiers contractés pour éviter de cambrer. Tenez un haltère lourd à deux mains par l'intérieur des disques au-dessus de la tête. Gardez les coudes serrés vers l'avant et fléchissez les avant-bras derrière la nuque jusqu'à sentir l'étirement des triceps, puis tendez les bras vers le ciel sans verrouiller brutalement.",
          formCues: [
            "Fixez les coudes : ils doivent rester stationnaires tout au long de la flexion.",
            "Gardez la cage thoracique rentrée et le regard droit devant vous.",
            "Descendez lentement sur 2 à 3 secondes pour un étirement optimal."
          ],
          breathing: "Inspirez pendant la descente derrière la tête, expirez en tendant les bras au sommet.",
          series: "3 à 4 séries",
          reps: "10 à 12 répétitions",
          rest: "0s (Passage direct au sol)"
        },
        {
          id: "db_2b",
          code: "2B",
          name: "Pompes Diamant au Sol",
          icon: "💎",
          categoryTag: "Triceps & Centre Pectoraux",
          badgeClass: "badge-indigo",
          equipment: "Poids du corps / Tapis",
          equipmentIcon: "🤸",
          summary: "Pompes mains rapprochées en losange pour concentrer l'effort de poussée sur les triceps.",
          instructions: "En appui facial sur les mains et les pointes de pieds. Rapprochez les mains sous le sternum pour former un diamant/losange avec les pouces et les index. Descendez la poitrine au contact des mains en gardant les coudes le long du corps, puis repoussez énergiquement le sol.",
          formCues: [
            "Alignement parfait : chevilles, fessiers, dos et tête sur une même ligne droite.",
            "Ne laissez pas les coudes s'écarter vers l'extérieur.",
            "Option adaptée : si nécessaire, effectuez le mouvement genoux au sol tout en gardant le bassin gainé."
          ],
          breathing: "Inspirez à la descente, expirez avec intensité lors de la poussée.",
          series: "3 à 4 séries",
          reps: "Max de répétitions (RPE 9-10)",
          rest: "60 secondes de repos"
        }
      ]
    },
    {
      blockId: 3,
      name: "BLOC 3 : Épaules",
      category: "shoulders",
      type: "combo",
      typeLabel: "🎯 SÉRIE COMBINÉE ÉPAULES 3D",
      targetSummary: "Deltoïdes (Faisceaux latéral & antérieur)",
      accentColor: "#ec4899",
      roundsRecommended: "3 à 4 séries",
      restSeconds: 50,
      restLabel: "45 à 60s de repos",
      supersetTip: "Chaque répétition associe une élévation latérale + une élévation frontale. Choisissez une charge modérée pour garder une forme stricte.",
      exercises: [
        {
          id: "db_3",
          code: "03",
          name: "Relevés Latéraux & Frontaux Combinés",
          icon: "🦅",
          categoryTag: "Deltoïdes Latéral & Antérieur",
          badgeClass: "badge-pink",
          equipment: "2 Haltères",
          equipmentIcon: "🏋️‍♂️",
          summary: "Combinaison dynamique pour sculpter des épaules rondes sans temps mort entre faisceaux.",
          instructions: "Debout, pieds largeur des hanches, genoux souples. Haltères le long des cuisses. Élevez simultanément les bras sur les côtés jusqu'à l'horizontale (hauteur des épaules), redescendez en retenant la charge, puis montez directement les deux haltères devant vous à hauteur des yeux. Cela constitue 1 répétition combinée complète.",
          formCues: [
            "Ne haussez pas les épaules : gardez les trapèzes relâchés pour isoler les deltoïdes.",
            "Légère flexion des coudes (environ 10°) pour protéger les tendons articulaires.",
            "Bannissez tout balancement du buste : engagez vos fessiers pour verrouiller le bassin."
          ],
          breathing: "Expirez lors de chaque montée, inspirez sur chaque descente contrôlée.",
          series: "3 à 4 séries",
          reps: "10 à 12 répétitions combinées",
          rest: "45-60 secondes de repos"
        }
      ]
    },
    {
      blockId: 4,
      name: "BLOC 4 : Jambes",
      category: "lower_body",
      type: "superset",
      typeLabel: "⚡ SUPERSET FORCE BAS DU CORPS",
      targetSummary: "Quadriceps, Fessiers, Ischio-jambiers",
      accentColor: "#10b981",
      roundsRecommended: "3 à 4 séries",
      restSeconds: 75,
      restLabel: "60 à 90s de repos",
      supersetTip: "La fente bulgare épuise unilatéralement la jambe avant, puis les squats aux haltères terminent le recrutement en chaîne globale.",
      exercises: [
        {
          id: "db_4a",
          code: "4A",
          name: "Fentes Surélevées (Bulgarian Split Squats)",
          icon: "🦵",
          categoryTag: "Quadriceps & Fessiers (Unilatéral)",
          badgeClass: "badge-emerald",
          equipment: "2 Haltères + Chaise ou Banc",
          equipmentIcon: "🪑",
          summary: "L'un des meilleurs exercices de musculation pour galber les fessiers et développer la stabilité de hanche.",
          instructions: "Debout à environ un pas devant une chaise ou un banc. Posez le dessus d'un pied en arrière sur l'assise, un haltère dans chaque main. Fléchissez la jambe avant jusqu'à ce que la cuisse soit parallèle au sol (genou à 90°), le genou arrière descendant vers le tapis, puis poussez fort sur le talon avant pour remonter. Faites vos répétitions puis changez de jambe.",
          formCues: [
            "80% de votre poids doit reposer fermement sur le talon de la jambe avant.",
            "Inclinez très légèrement le buste en avant (dos plat) pour suractiver le grand fessier.",
            "Le genou avant reste toujours dans l'axe du 2ème orteil sans s'effondrer vers l'intérieur."
          ],
          breathing: "Inspirez à la descente en contrôlant le mouvement, expirez en repoussant sur le talon avant.",
          series: "3 à 4 séries",
          reps: "10 à 12 réps par jambe",
          rest: "0s (Enchaînement direct vers 4B)"
        },
        {
          id: "db_4b",
          code: "4B",
          name: "Squats Complets aux Haltères",
          icon: "🏋️",
          categoryTag: "Quadriceps, Fessiers & Ischios",
          badgeClass: "badge-green",
          equipment: "2 Haltères",
          equipmentIcon: "🏋️‍♂️",
          summary: "Squat bilatéral avec haltères calés sur les épaules ou tenus le long du corps pour un maximum de tension.",
          instructions: "Pieds largeur d'épaules, pointes légèrement ouvertes à 15°. Tenez les haltères posés sur l'avant des épaules (Front Rack) ou bras tendus le long du corps. Initiez la descente en poussant les fesses vers l'arrière et en ouvrant les genoux. Descendez jusqu'à ce que les cuisses soient au moins parallèles au sol, puis repoussez le sol.",
          formCues: [
            "Poussez activement les genoux vers l'extérieur pour ouvrir l'espace pelvien.",
            "Gardez les talons cloués au sol et la poitrine fière tout au long du mouvement.",
            "Maintenez une respiration intra-abdominale pour verrouiller le bas du dos."
          ],
          breathing: "Inspirez profondément à la descente, expirez puissamment une fois passé le point dur de la remontée.",
          series: "3 à 4 séries",
          reps: "12 répétitions",
          rest: "60-90 secondes de repos"
        }
      ]
    },
    {
      blockId: 5,
      name: "BLOC 5 : Biceps",
      category: "arms_biceps",
      type: "isolation",
      typeLabel: "💪 ISOLATION INTENSIVE BICEPS",
      targetSummary: "Biceps Brachial & Brachio-radial",
      accentColor: "#f59e0b",
      roundsRecommended: "3 à 4 séries",
      restSeconds: 50,
      restLabel: "45 à 60s de repos",
      supersetTip: "La supination (rotation du poignet vers l'extérieur) active à 100% les deux chefs du biceps pour un pic de contraction maximal.",
      exercises: [
        {
          id: "db_5",
          code: "05",
          name: "Curl Biceps en Rotation (Supination)",
          icon: "💪",
          categoryTag: "Biceps Brachial & Avant-bras",
          badgeClass: "badge-amber",
          equipment: "2 Haltères",
          equipmentIcon: "🏋️‍♂️",
          summary: "Flexion des coudes avec rotation externe pour développer l'épaisseur et le galbe des bras.",
          instructions: "Debout, pieds stables, haltères le long des flancs en prise neutre (paumes face à face). Tout en gardant les coudes collés aux côtes, montez les haltères en pivotant les poignets vers l'extérieur pour amener les paumes face aux épaules en haut du mouvement. Marquez 1 seconde de contraction maximale puis redescendez lentement.",
          formCues: [
            "Ne laissez pas vos coudes avancer vers l'avant : ils restent verrouillés contre le flanc.",
            "Pivotez bien le petit doigt vers le haut au sommet pour accentuer la supination.",
            "Contrôlez la descente sur 2 à 3 secondes : la phase excentrique construit le plus de muscle."
          ],
          breathing: "Expirez lors de la montée et de la rotation, inspirez lors de la descente lente et contrôlée.",
          series: "3 à 4 séries",
          reps: "10 à 12 répétitions",
          rest: "45-60 secondes de repos"
        }
      ]
    },
    {
      blockId: 6,
      name: "BLOCS 6 & 7 : Finition Sangle Abdominale",
      category: "core_circuit",
      type: "circuit",
      typeLabel: "🔥 CIRCUIT FINITION CORE EN 2 TEMPS",
      targetSummary: "Obliques, Grand Droit, Transverse & Stabilisateurs",
      accentColor: "#f97316",
      roundsRecommended: "3 séries du circuit",
      restSeconds: 45,
      restLabel: "45s de repos entre chaque tour de circuit",
      supersetTip: "Enchaînez sans pause les Russian Twists (mouvement dynamique de rotation avec charge) et la Planche (isométrie profonde). Reposez-vous 45s avant de recommencer.",
      exercises: [
        {
          id: "db_6",
          code: "06",
          name: "Russian Twist (Rotation du buste avec Haltère)",
          icon: "🌪️",
          categoryTag: "Obliques & Grand Droit",
          badgeClass: "badge-orange",
          equipment: "1 Haltère + Tapis",
          equipmentIcon: "🏋️",
          summary: "Travail rotatif avec charge pour renforcer la taille, les obliques et la puissance du tronc.",
          instructions: "Assis au sol, genoux fléchis, inclinez le buste en arrière à 45° dos droit. Tenez un haltère à deux mains contre la poitrine. Pivotez le buste d'un côté en amenant l'haltère près de la hanche, revenez au centre puis pivotez de l'autre côté avec fluidité et contrôle.",
          formCues: [
            "Faites pivoter toute la cage thoracique et les épaules, et non pas seulement les bras.",
            "Conservez une légère cambrure naturelle et le torse bombé pour protéger le bas du dos.",
            "Option avancée : décollez les talons du sol de 5 cm pour un recrutement maximal du droit de l'abdomen."
          ],
          breathing: "Expirez lors de chaque rotation latérale, inspirez brièvement lors du passage au centre.",
          series: "3 séries du circuit",
          reps: "12 à 15 rotations au total",
          rest: "0s (Bascule directe en planche)"
        },
        {
          id: "db_7",
          code: "07",
          name: "Planche Classique (Gainage Isométrique)",
          icon: "🧱",
          categoryTag: "Transverse & Stabilité Profonde",
          badgeClass: "badge-teal",
          equipment: "Poids du corps / Tapis",
          equipmentIcon: "🤸",
          summary: "Verrouillage isométrique pour sculpter un ventre plat, protéger la colonne et renforcer le transverse.",
          instructions: "En appui sur les avant-bras et la pointe des pieds. Coudes positionnés directement sous les épaules. Alignez chevilles, genoux, hanches, dos et tête. Rétroversez légèrement le bassin, serrez les fessiers et aspirez le nombril vers l'intérieur.",
          formCues: [
            "Ne laissez jamais le bassin s'affaisser vers le sol : serrez volontairement fessiers et quadriceps.",
            "Repoussez activement le sol avec les avant-bras pour écarter les omoplates (protraction scapulaire).",
            "Conservez la nuque longue en regardant vos mains au sol."
          ],
          breathing: "Respiration ventrale lente, profonde et continue sans jamais bloquer votre souffle.",
          series: "3 séries du circuit",
          reps: "30 à 45 secondes de maintien",
          rest: "45 secondes avant le tour suivant"
        }
      ]
    }
  ]
};

// --------------------------------------------------------------------------
// CONTRÔLEUR INTERACTIF DE LA SÉANCE HALTÈRES (DumbbellsManager)
// --------------------------------------------------------------------------
class DumbbellsManager {
  constructor() {
    this.workout = DUMBBELL_WORKOUT_DATA;
    this.completedSets = this.loadCompletedSets();
    this.weights = this.loadWeights();
    this.targetRounds = 3; // 3 ou 4 séries
    this.restTimer = null;
    this.restRemaining = 0;
    this.restTotal = 0;
    this.isResting = false;
  }

  init() {
    this.renderView();
    this.bindEvents();
  }

  loadWeights() {
    try {
      const saved = localStorage.getItem('fb17_dumbbells_weights');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveWeights() {
    try {
      localStorage.setItem('fb17_dumbbells_weights', JSON.stringify(this.weights));
    } catch (e) {}
  }

  getExerciseWeight(exerciseId) {
    if (this.weights && this.weights[exerciseId] !== undefined) {
      return this.weights[exerciseId];
    }
    const defaultWeight = (window.appStorage && window.appStorage.prefs && window.appStorage.prefs.dumbbellWeightKg)
      ? window.appStorage.prefs.dumbbellWeightKg
      : 10;
    return defaultWeight;
  }

  adjustWeight(exerciseId, delta) {
    const current = this.getExerciseWeight(exerciseId);
    const newWeight = Math.max(1, Math.min(60, current + delta));
    this.weights[exerciseId] = newWeight;
    this.saveWeights();
    if (typeof document !== 'undefined') {
      const el = document.getElementById(`weight-val-${exerciseId}`);
      if (el) el.textContent = `${newWeight} kg`;
    }
  }

  loadCompletedSets() {
    try {
      const saved = localStorage.getItem('fb17_dumbbells_completed_sets');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  saveCompletedSets() {
    try {
      localStorage.setItem('fb17_dumbbells_completed_sets', JSON.stringify(this.completedSets));
    } catch (e) {}
  }

  toggleSet(exerciseId, setIndex) {
    const key = `${exerciseId}_s${setIndex}`;
    this.completedSets[key] = !this.completedSets[key];
    this.saveCompletedSets();
    this.updateSetButtonUI(exerciseId, setIndex, this.completedSets[key]);
    this.updateProgressSummary();

    // Feedback sonore discret si activé
    if (this.completedSets[key] && window.audioEngine && typeof window.audioEngine.playCountdownBeep === 'function') {
      try { window.audioEngine.playCountdownBeep(3); } catch (e) {}
    }
  }

  updateSetButtonUI(exerciseId, setIndex, isDone) {
    if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return;
    const btn = document.querySelector(`.db-set-chip[data-ex="${exerciseId}"][data-set="${setIndex}"]`);
    if (btn) {
      btn.classList.toggle('completed', !!isDone);
      btn.setAttribute('aria-checked', isDone ? 'true' : 'false');
    }
  }

  resetAllSets() {
    this.completedSets = {};
    this.saveCompletedSets();
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.db-set-chip').forEach(btn => {
        btn.classList.remove('completed');
        btn.setAttribute('aria-checked', 'false');
      });
    }
    this.updateProgressSummary();
    if (typeof showToast === 'function') {
      showToast("🔄 Progression des séries réinitialisée !");
    }
  }

  setTargetRounds(rounds) {
    this.targetRounds = Number(rounds) || 3;
    if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
      document.querySelectorAll('.db-rounds-pill-btn').forEach(b => {
        b.classList.toggle('active', Number(b.dataset.rounds) === this.targetRounds);
      });
    }
    this.renderView();
  }

  // --- Gestion du Chronomètre de Repos Interactif ---
  startRestTimer(seconds, label = 'Repos') {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }

    this.restRemaining = seconds;
    this.restTotal = seconds;
    this.isResting = true;

    // Déclencher le son de départ repos
    if (window.audioEngine && typeof window.audioEngine.playRestTone === 'function') {
      try { window.audioEngine.playRestTone(); } catch (e) {}
    }

    this.showRestFloatingBar(label);

    this.restTimer = setInterval(() => {
      this.restRemaining--;

      // Bips de décompte sur les 3 dernières secondes
      if (this.restRemaining <= 3 && this.restRemaining > 0) {
        if (window.audioEngine && typeof window.audioEngine.playCountdownBeep === 'function') {
          try { window.audioEngine.playCountdownBeep(this.restRemaining); } catch (e) {}
        }
      }

      if (this.restRemaining <= 0) {
        this.stopRestTimer();
        if (window.audioEngine && typeof window.audioEngine.playGoTone === 'function') {
          try { window.audioEngine.playGoTone(); } catch (e) {}
        }
        if (typeof showToast === 'function') {
          showToast("⚡ Temps de repos terminé ! C'est reparti !");
        }
      } else {
        this.updateRestFloatingBar();
      }
    }, 1000);
  }

  stopRestTimer() {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
    this.isResting = false;
    this.hideRestFloatingBar();
  }

  showRestFloatingBar(label) {
    let bar = document.getElementById('dumbbell-rest-floating-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'dumbbell-rest-floating-bar';
      bar.className = 'dumbbell-rest-bar';
      document.body.appendChild(bar);
    }

    const pct = ((this.restTotal - this.restRemaining) / this.restTotal) * 100;
    bar.innerHTML = `
      <div class="db-rest-content">
        <div class="db-rest-left">
          <span class="db-rest-icon">⏱️</span>
          <div>
            <div class="db-rest-title">${label}</div>
            <div class="db-rest-time" id="db-rest-time-display">${this.formatRestSeconds(this.restRemaining)}</div>
          </div>
        </div>
        <div class="db-rest-actions">
          <button class="db-rest-skip-btn" onclick="window.dumbbellsManager.stopRestTimer()">Passer ✕</button>
        </div>
      </div>
      <div class="db-rest-progress-track">
        <div class="db-rest-progress-fill" id="db-rest-progress-fill" style="width: ${pct}%"></div>
      </div>
    `;
    bar.classList.add('visible');
  }

  updateRestFloatingBar() {
    const timeEl = document.getElementById('db-rest-time-display');
    const fillEl = document.getElementById('db-rest-progress-fill');
    if (timeEl) timeEl.textContent = this.formatRestSeconds(this.restRemaining);
    if (fillEl) {
      const pct = ((this.restTotal - this.restRemaining) / this.restTotal) * 100;
      fillEl.style.width = `${pct}%`;
    }
  }

  hideRestFloatingBar() {
    const bar = document.getElementById('dumbbell-rest-floating-bar');
    if (bar) {
      bar.classList.remove('visible');
      setTimeout(() => {
        if (!this.isResting && bar.parentElement) {
          bar.remove();
        }
      }, 300);
    }
  }

  formatRestSeconds(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m > 0 ? m + ':' : ''}${s < 10 && m > 0 ? '0' : ''}${s}s`;
  }

  updateProgressSummary() {
    const totalExercises = 7;
    const requiredTotal = totalExercises * this.targetRounds;
    let doneCount = 0;

    for (let r = 1; r <= this.targetRounds; r++) {
      ['db_1a', 'db_1b', 'db_2a', 'db_2b', 'db_3', 'db_4a', 'db_4b', 'db_5', 'db_6', 'db_7'].forEach(id => {
        if (this.completedSets[`${id}_s${r}`]) doneCount++;
      });
    }

    // Nombre d'exercices considérés : 10 mouvements totaux (supersets décomposés)
    const effectiveTotal = 10 * this.targetRounds;
    const pct = Math.min(100, Math.round((doneCount / effectiveTotal) * 100));

    const progressEl = document.getElementById('db-progress-pct');
    const barEl = document.getElementById('db-progress-bar-fill');
    const countEl = document.getElementById('db-progress-count');

    if (progressEl) progressEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
    if (countEl) countEl.textContent = `${doneCount} / ${effectiveTotal} séries validées`;
  }

  // --- Rendu HTML Dynamique de la Vue Complète ---
  renderView() {
    const container = document.getElementById('view-dumbbells');
    if (!container) return;

    container.innerHTML = `
      <!-- En-tête de la séance & Hero Card -->
      <div class="section-header">
        <div>
          <h2 class="section-title">2 Haltères • Full Body &amp; Core</h2>
          <span class="section-subtitle">Prise de masse, volume &amp; renforcement fonctionnel</span>
        </div>
        <button class="btn-secondary" style="width: auto; padding: 6px 12px; font-size: 0.75rem;" onclick="window.dumbbellsManager.resetAllSets()" title="Réinitialiser les séries cochées">
          🔄 Reset séries
        </button>
      </div>

      <!-- Grande Carte Hero d'introduction -->
      <div class="dumbbell-hero-card">
        <div class="db-hero-header">
          <div class="db-hero-badge">
            <span class="pulse-dot"></span> Programme Spécial Haltères
          </div>
          <div class="db-hero-time-chip">⏱️ ${this.workout.estimatedDuration}</div>
        </div>

        <div class="db-hero-title-wrap">
          <h1 class="db-hero-title">${this.workout.title}</h1>
          <p class="db-hero-desc">${this.workout.subtitle}</p>
        </div>

        <!-- Badges d'équipement requis -->
        <div class="db-equipments-row">
          ${this.workout.equipmentList.map(eq => `
            <div class="db-eq-pill" title="${eq.desc}">
              <span>${eq.icon}</span>
              <span>${eq.name}</span>
            </div>
          `).join('')}
        </div>

        <!-- Sélecteur de Volume : 3 Séries vs 4 Séries -->
        <div class="db-rounds-selector">
          <span class="db-rounds-label">🎯 Volume de travail :</span>
          <div class="db-rounds-buttons">
            <button class="db-rounds-pill-btn ${this.targetRounds === 3 ? 'active' : ''}" data-rounds="3" onclick="window.dumbbellsManager.setTargetRounds(3)">
              3 Séries (Intermédiaire)
            </button>
            <button class="db-rounds-pill-btn ${this.targetRounds === 4 ? 'active' : ''}" data-rounds="4" onclick="window.dumbbellsManager.setTargetRounds(4)">
              4 Séries (Avancé)
            </button>
          </div>
        </div>

        <!-- Barre de Progression Globale de la séance -->
        <div class="db-progress-box">
          <div class="db-progress-header">
            <span class="db-progress-label">Progression de la séance</span>
            <span class="db-progress-pct" id="db-progress-pct">0%</span>
          </div>
          <div class="db-progress-track">
            <div class="db-progress-fill" id="db-progress-bar-fill" style="width: 0%"></div>
          </div>
          <div class="db-progress-count" id="db-progress-count">0 / ${10 * this.targetRounds} séries validées</div>
        </div>

        <!-- Bouton Démarrage Séance Interactive avec Chrono & Coach -->
        <button class="btn-primary db-live-start-btn" onclick="startWorkoutSession({ mode: 'dumbbells' })" style="margin-top: 16px; width: 100%;">
          <svg viewBox="0 0 24 24" style="width: 22px; height: 22px; fill: currentColor;">
            <path d="M8 5v14l11-7z"/>
          </svg>
          LANCER LA SÉANCE INTERACTIVE (2 HALTÈRES)
        </button>
      </div>

      <!-- Liste des 6 Blocs d'entraînement -->
      <div class="dumbbell-blocks-container">
        ${this.workout.blocks.map(block => this.renderBlockHtml(block)).join('')}
      </div>

      <!-- Carte d'étirements & retour au calme recommandée -->
      <div class="db-cooldown-card">
        <div class="db-cooldown-left">
          <span class="db-cooldown-icon">🧘‍♂️</span>
          <div>
            <div class="db-cooldown-title">Fin de séance • Retour au calme</div>
            <div class="db-cooldown-desc">Prenez 3 à 5 minutes pour étirer pectoraux, fessiers, dos et ischios.</div>
          </div>
        </div>
        <button class="btn-secondary" style="width: auto; padding: 8px 14px; font-size: 0.8rem;" onclick="switchTab('home')">
          Retour Accueil
        </button>
      </div>
    `;

    this.updateProgressSummary();
  }

  renderBlockHtml(block) {
    return `
      <div class="dumbbell-block-card" id="db-block-${block.blockId}" style="--block-accent: ${block.accentColor};">
        <div class="db-block-header">
          <div class="db-block-title-row">
            <span class="db-block-badge">${block.typeLabel}</span>
            <span class="db-block-rounds-tag">${block.roundsRecommended}</span>
          </div>
          <h3 class="db-block-name">${block.name}</h3>
          <div class="db-block-muscles">
            <span class="db-muscles-icon">🎯</span>
            <span><strong>Cible :</strong> ${block.targetSummary}</span>
          </div>
          <div class="db-block-tip-box">
            💡 <em>${block.supersetTip}</em>
          </div>
        </div>

        <!-- Exercices du bloc -->
        <div class="db-block-exercises">
          ${block.exercises.map((ex, exIdx) => this.renderExerciseCardHtml(ex, block, exIdx)).join('')}
        </div>

        <!-- Bouton Rapide de Chrono de Repos -->
        <div class="db-block-footer">
          <button class="db-btn-rest-trigger" onclick="window.dumbbellsManager.startRestTimer(${block.restSeconds}, 'Repos ${block.name}')">
            ⏱️ Démarrer ${block.restSeconds}s de repos
          </button>
        </div>
      </div>
    `;
  }

  renderExerciseCardHtml(ex, block, exIdx) {
    const isSupersetSecond = (block.type === 'superset' && exIdx > 0);
    const liveIdMap = {
      db_1a: 101, db_1b: 102, db_2a: 103, db_2b: 104, db_3: 105,
      db_4a: 106, db_4b: 107, db_5: 108, db_6: 109, db_7: 110
    };
    const liveId = liveIdMap[ex.id] || null;

    return `
      ${isSupersetSecond ? `
        <div class="db-superset-divider">
          <span class="db-superset-connector-line"></span>
          <span class="db-superset-tag">ENCHAÎNEMENT DIRECT SANS REPOS ⬇️</span>
          <span class="db-superset-connector-line"></span>
        </div>
      ` : ''}

      <div class="dumbbell-exercise-card" id="card-${ex.id}">
        <div class="db-ex-header">
          <div class="db-ex-code-badge">${ex.code}</div>
          <div class="db-ex-title-wrap">
            <h4 class="db-ex-name">${ex.name}</h4>
            <div class="db-ex-badges-row">
              <span class="db-muscle-badge ${ex.badgeClass}">${ex.categoryTag}</span>
              <span class="db-equip-badge">${ex.equipmentIcon} ${ex.equipment}</span>
              ${liveId ? `<button type="button" class="db-preview-video-btn" onclick="openExerciseModal(${liveId})" title="Voir vidéo et démo">🎬 Démo &amp; Vidéo</button>` : ''}
            </div>
          </div>
          <span class="db-ex-main-icon">${ex.icon}</span>
        </div>

        <!-- Spécifications Clés (Format, Répétitions, Repos) -->
        <div class="db-ex-specs-grid">
          <div class="db-spec-item">
            <span class="db-spec-label">SÉRIES</span>
            <span class="db-spec-val">${this.targetRounds} Séries</span>
          </div>
          <div class="db-spec-item highlight">
            <span class="db-spec-label">RÉPÉTITIONS</span>
            <span class="db-spec-val">${ex.reps}</span>
          </div>
          <div class="db-spec-item">
            <span class="db-spec-label">RÉCUPÉRATION</span>
            <span class="db-spec-val">${ex.rest}</span>
          </div>
        </div>

        ${ex.equipment && ex.equipment.includes('Haltère') ? `
        <!-- Sélecteur de Charge / Poids par exercice -->
        <div class="db-weight-row">
          <span class="db-weight-label">🏋️ Charge par haltère :</span>
          <div class="db-weight-stepper">
            <button type="button" class="db-weight-btn" onclick="window.dumbbellsManager.adjustWeight('${ex.id}', -1)" aria-label="Diminuer charge">-</button>
            <span class="db-weight-value" id="weight-val-${ex.id}">${this.getExerciseWeight(ex.id)} kg</span>
            <button type="button" class="db-weight-btn" onclick="window.dumbbellsManager.adjustWeight('${ex.id}', 1)" aria-label="Augmenter charge">+</button>
          </div>
        </div>
        ` : ''}

        <!-- Traqueur de séries interactif -->
        <div class="db-series-tracker">
          <span class="db-tracker-label">Séries cochées :</span>
          <div class="db-tracker-chips">
            ${Array.from({ length: this.targetRounds }, (_, i) => {
              const setNum = i + 1;
              const isChecked = !!this.completedSets[`${ex.id}_s${setNum}`];
              return `
                <button
                  type="button"
                  class="db-set-chip ${isChecked ? 'completed' : ''}"
                  data-ex="${ex.id}"
                  data-set="${setNum}"
                  onclick="window.dumbbellsManager.toggleSet('${ex.id}', ${setNum})"
                  role="checkbox"
                  aria-checked="${isChecked ? 'true' : 'false'}"
                  aria-label="${ex.name} Série ${setNum}">
                  <span class="db-set-chip-check">${isChecked ? '✓' : '○'}</span>
                  <span>Série ${setNum}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Consignes d'exécution & Détails dépliables -->
        <details class="db-ex-details">
          <summary class="db-ex-summary-btn">
            <span>📋 Consignes &amp; Forme parfaite</span>
            <span class="db-summary-arrow">▾</span>
          </summary>
          <div class="db-ex-details-body">
            <p class="db-execution-text"><strong>Exécution :</strong> ${ex.instructions}</p>
            
            <div class="db-cues-section">
              <span class="db-cues-title">🔑 Clés techniques &amp; posture :</span>
              <ul class="db-cues-list">
                ${ex.formCues.map(c => `<li>${c}</li>`).join('')}
              </ul>
            </div>

            <div class="db-breathing-box">
              <span>🌬️ <strong>Respiration :</strong> ${ex.breathing}</span>
            </div>
          </div>
        </details>
      </div>
    `;
  }

  bindEvents() {
    // Écouteur global si besoin
  }
}

// Instance globale exportée
window.DUMBBELL_WORKOUT_DATA = DUMBBELL_WORKOUT_DATA;
window.dumbbellsManager = new DumbbellsManager();
