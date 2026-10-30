/**
 * FULL BODY 17 — BASE D'EXERCICES ÉTENDUE & SÉLECTION PAR NIVEAU
 * Catalogue d'exercices par difficulté (Débutant, Intermédiaire, Avancé) et routines personnalisées.
 */

function renderExerciseMediaHtml(ex) {
  return `
    <div class="exercise-media-card" data-exercise-id="${ex.id}">
      <div class="exercise-media-viewport" id="viewport-ex-${ex.id}">
        <video
          src="${ex.video}"
          poster="${ex.image}"
          class="exercise-video-reel"
          autoplay
          muted
          loop
          playsinline
          webkit-playsinline
          preload="auto"
          onerror="(function(v){
            v.style.display='none';
            var wrap = v.parentElement.querySelector('.motion-canvas-wrapper');
            if(wrap){
              wrap.style.display='block';
              var c = wrap.querySelector('canvas');
              if(c && window.motionPlayer) window.motionPlayer.init(c, ${ex.id});
            }
          })(this)">
        </video>
        <div class="motion-canvas-wrapper">
          <canvas aria-label="Animation de l'exercice ${ex.name}"></canvas>
          <span class="offline-video-chip">📵 Animation fluide hors ligne</span>
        </div>
        <img src="${ex.image}" alt="${ex.name}" class="exercise-fallback-image fallback-img" style="display: none;">
      </div>
    </div>
  `;
}

const EXERCISES_DATA = [
  {
    id: 1,
    number: "01",
    name: "JUMPING JACK",
    subtitle: "Cardio dynamique & activation globale",
    duration: 30,
    level: "beginner",
    levelLabel: "Débutant",
    category: "cardio",
    image: "images/ex_1_jumping_jack.jpg",
    video: "videos/ex_1_jumping_jack.mp4",
    targetMuscles: "Mollets, Quadriceps, Épaules, Cardio",
    targetPrimary: "MOLLETS & CARDIO",
    cue: "Réception souple sur l'avant des pieds, genoux légèrement fléchis, rythme régulier et continu.",
    breathing: "Inspirez à l'ouverture des bras, expirez lors du resserrement.",
    description: "Sauts rythmés en écartant simultanément les bras au-dessus de la tête et les jambes. Parfait pour élever la fréquence cardiaque, réchauffer les articulations et stimuler l'organisme.",
    adaptation: "Débutant : Version sans saut (Side Jacks : pas de côté alterné en levant les bras). Avancé : Accélération de la cadence avec ouverture complète.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 2,
    number: "02",
    name: "SQUAT LIBRE",
    subtitle: "Poids du corps, dos droit",
    duration: 30,
    level: "beginner",
    levelLabel: "Tous Niveaux",
    category: "lower_body",
    image: "images/ex_2_squat.jpg",
    video: "videos/ex_2_squat.mp4",
    targetMuscles: "Quadriceps, Ischio-jambiers, Fessiers, Gainage",
    targetPrimary: "QUADRICEPS & FESSIERS",
    cue: "Pieds largeur d'épaules, genoux alignés avec les pointes de pieds, buste fier et regard vers l'avant.",
    breathing: "Inspirez à la descente, expirez en repoussant le sol par les talons.",
    description: "Fléchir les genoux en envoyant les hanches vers l'arrière comme pour s'asseoir sur une chaise. Descendez jusqu'à ce que les cuisses soient parallèles au sol.",
    adaptation: "Débutant : Faites le mouvement en effleurant une vraie chaise derrière vous. Avancé : Marquez 1 seconde de pause en position basse ou effectuez des jump squats.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 3,
    number: "03",
    name: "POMPES AU SOL",
    subtitle: "Poussée pectorale & gainage actif",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "upper_body",
    image: "images/ex_3_pushups.jpg",
    video: "videos/ex_3_pushups.mp4",
    targetMuscles: "Pectoraux, Triceps, Deltoïdes antérieurs, Abdominaux",
    targetPrimary: "PECTORAUX & TRICEPS",
    cue: "Corps parfaitement gainé en planche, coudes à 45° du corps, nuque neutre.",
    breathing: "Inspirez en descendant la poitrine vers le sol, expirez en repoussant.",
    description: "En appui facial, mains légèrement plus écartées que les épaules. Gardez les abdominaux et les fessiers contractés sans creuser le bas du dos.",
    adaptation: "Débutant : Pompes inclinées contre une table ou sur les genoux. Avancé : Descente ralentie en 3 secondes ou tempo explosif.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 4,
    number: "04",
    name: "CRUNCH & SCISSOR KICKS",
    subtitle: "Combo Abdominaux : haut & bas du ventre",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "core",
    image: "images/ex_4_crunch_scissor.jpg",
    video: "videos/ex_4_crunch_scissor.mp4",
    targetMuscles: "Grand droit, Abdominaux inférieurs, Obliques, Psoas",
    targetPrimary: "GRAND DROIT & ABDOS BAS",
    cue: "Bas du dos bien plaqué au sol, nombril rentré, jambes tendues et ciseaux contrôlés.",
    breathing: "Expirez lors de l'effort et de la contraction, inspirez régulièrement.",
    description: "Allongé sur le dos sur tapis : enroulement contrôlé du haut du buste combiné à des battements de jambes alternés en ciseaux pour un recrutement complet des abdominaux.",
    adaptation: "Débutant : Mains sous les fessiers pour soulager les lombaires et ciseaux plus hauts. Avancé : Épaules constamment décollées, jambes au ras du sol.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 5,
    number: "05",
    name: "MOUNTAIN CLIMBERS",
    subtitle: "Cardio dynamique & sangle abdominale",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "cardio",
    image: "images/ex_mountain_climbers.jpg",
    video: "videos/ex_mountain_climbers.mp4",
    targetMuscles: "Grand droit, Fléchisseurs de hanches, Épaules, Cardio",
    targetPrimary: "CARDIO & ABDOMINAUX",
    cue: "Dos plat aligné en planche, mains sous les épaules, ramenez les genoux vers la poitrine avec rythme.",
    breathing: "Respiration rythmée et dynamique en accord avec les montées de genoux.",
    description: "En position de pompe haute, amenez alternativement et rapidement les genoux vers le buste en gardant les abdominaux gainés et les hanches stables à hauteur d'épaules.",
    adaptation: "Débutant : Version pas à pas lente et contrôlée sans impulsion. Avancé : Vitesse maximale ou genoux croisés vers le coude opposé.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 6,
    number: "06",
    name: "PONT FESSIER",
    subtitle: "Extension pelvienne & chaîne postérieure",
    duration: 30,
    level: "beginner",
    levelLabel: "Débutant",
    category: "lower_body",
    image: "images/ex_5_bridge.jpg",
    video: "videos/ex_5_bridge.mp4",
    targetMuscles: "Grand fessier, Ischio-jambiers, Lombaires, Transverse",
    targetPrimary: "GRAND FESSIER & ISCHIOS",
    cue: "Poussez fermement sur les talons, contractez fort les fessiers en haut 1 à 2 secondes.",
    breathing: "Expirez en élevant le bassin, inspirez en redescendant sans poser le dos.",
    description: "Allongé sur le dos, genoux fléchis, pieds à plat au sol écartés de la largeur des hanches. Élevez le bassin jusqu'à former une ligne droite genoux-hanches-épaules.",
    adaptation: "Débutant : Amplitude confortable en posant le dos à chaque répétition. Avancé : Maintenez une jambe levée (unilatéral) 20s de chaque côté.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 7,
    number: "07",
    name: "EXTENSION DE HANCHE DEBOUT",
    subtitle: "Activation fessière & posture",
    duration: 30,
    level: "beginner",
    levelLabel: "Débutant",
    category: "lower_body",
    image: "images/ex_6_hip_ext.jpg",
    video: "videos/ex_6_hip_ext.mp4",
    targetMuscles: "Grand fessier, Ischio-jambiers, Érecteurs du rachis, Posture",
    targetPrimary: "FESSIERS & CHAÎNE POST.",
    cue: "Buste stable et gainé sans cambrer le bas du dos. Contractez le fessier en poussant la jambe vers l'arrière.",
    breathing: "Expirez lors de l'extension de jambe, inspirez au retour.",
    description: "Debout, en appui stable sur une jambe, étendre l'autre jambe vers l'arrière de manière contrôlée sans pencher excessivement le tronc. Alternez les jambes à mi-temps (20s / 20s).",
    adaptation: "Débutant : Prenez appui des deux mains sur le dossier d'une chaise ou un mur. Avancé : Sans aucun appui pour solliciter les stabilisateurs profonds.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 8,
    number: "08",
    name: "GAINAGE PLANCHE CLASSIQUE",
    subtitle: "Sangle abdominale profonde & transverse (30s - 2min)",
    duration: 45,
    isPlank: true,
    level: "beginner",
    levelLabel: "Tous Niveaux",
    category: "core",
    image: "images/ex_7_plank.jpg",
    video: "videos/ex_7_plank.mp4",
    targetMuscles: "Transverse, Grand droit, Obliques, Épaules, Fixateurs omoplates",
    targetPrimary: "TRANSVERSE & SANGLE ABD.",
    cue: "Corps rigide et aligné : rétroversion du bassin, nombril aspiré vers la colonne, regard au sol.",
    breathing: "Respiration continue, ventrale et fluide sans jamais bloquer le souffle.",
    description: "En appui sur les avant-bras et les pointes de pieds. Coudes placés sous les épaules à 90°. Maintenez l'alignement parfait chevilles-hanches-épaules sans cambrer.",
    adaptation: "30s : Débutant / Reprise • 45s : Standard régulier • 60s : Intermédiaire avancé • 2 min (120s) : Défi endurance.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 9,
    number: "09",
    name: "ÉTIREMENTS DYNAMIQUES",
    subtitle: "Mobilité, souplesse & retour au calme (1 série finale)",
    duration: 30,
    isCoolDown: true,
    level: "beginner",
    levelLabel: "Tous Niveaux",
    category: "full_body",
    image: "images/ex_8_stretching.jpg",
    video: "videos/ex_8_stretching.mp4",
    targetMuscles: "Chaîne postérieure, Cage thoracique, Épaules, Psoas",
    targetPrimary: "OUVERTURE THORACIQUE",
    cue: "Mouvements amples, lents et fluides. Ne forcez jamais dans la douleur.",
    breathing: "Respiration ventrale profonde et régénératrice.",
    description: "Enchaînement fluide : ouvertures de cage thoracique avec cercles de bras, rotations douces du buste, et flexions lentes de hanches pour relâcher les tensions musculaires.",
    adaptation: "Tous niveaux : Adaptez l'amplitude à votre souplesse naturelle. Favorisez l'oxygénation et la décompression vertébrale.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 10,
    number: "10",
    name: "FENTES ALTERNÉES",
    subtitle: "Renforcement unilatéral cuisses & équilibre",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "lower_body",
    image: "images/ex_10_lunges.jpg",
    video: "videos/ex_10_lunges.mp4",
    targetMuscles: "Quadriceps, Fessiers, Ischio-jambiers, Équilibre",
    targetPrimary: "CUISSES & ÉQUILIBRE",
    cue: "Grand pas en avant, genou arrière descendant à 90° sans toucher le sol brutalement, buste droit.",
    breathing: "Inspirez à la flexion, expirez en repoussant sur le talon avant pour revenir.",
    description: "Faites un pas vers l'avant, fléchissez les deux genoux jusqu'à 90°, puis repoussez sur le talon pour revenir en position initiale et alterner avec l'autre jambe.",
    adaptation: "Débutant : Fentes arrières statiques ou fentes avec appui sur une chaise. Avancé : Fentes sautées explosives.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 11,
    number: "11",
    name: "POMPES SUR LES GENOUX",
    subtitle: "Apprentissage de la poussée pectorale sans contrainte lombaire",
    duration: 30,
    level: "beginner",
    levelLabel: "Débutant",
    category: "upper_body",
    image: "images/ex_11_knee_pushups.jpg",
    video: "videos/ex_11_knee_pushups.mp4",
    targetMuscles: "Pectoraux, Triceps, Deltoïdes",
    targetPrimary: "PECTORAUX (ACCESSIBLE)",
    cue: "Genoux au sol, bassin aligné avec les épaules, coudes fléchis vers l'arrière.",
    breathing: "Inspirez en descendant la poitrine vers le sol, expirez en poussant.",
    description: "Variante idéale pour développer la force de poussée du haut du corps en toute sécurité et sans cambrer le bas du dos.",
    adaptation: "Débutant : Amplitude progressive. Avancé : Transition progressive vers les pompes sur pointes de pieds.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 12,
    number: "12",
    name: "POMPES DIAMANT",
    subtitle: "Poussée ciblée sur les triceps & centre des pectoraux",
    duration: 30,
    level: "advanced",
    levelLabel: "Avancé",
    category: "upper_body",
    image: "images/ex_12_diamond_pushups.jpg",
    video: "videos/ex_12_diamond_pushups.mp4",
    targetMuscles: "Triceps, Pectoraux faisceau sternal, Deltoïdes antérieurs",
    targetPrimary: "TRICEPS & FORCE HAUT DU CORPS",
    cue: "Pouces et index joints sous le sternum formant un losange, coudes proches du buste.",
    breathing: "Inspirez à la descente contrôlée, expirez lors de la poussée explosive.",
    description: "En position de planche, placez les mains l'une contre l'autre en diamant pour intensifier le travail de contraction des triceps et des pectoraux.",
    adaptation: "Intermédiaire : Exécuter sur les genoux. Avancé : Pieds surélevés sur un banc.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 13,
    number: "13",
    name: "BURPEES CARDIO",
    subtitle: "Puissance globale, cardio & explosivité",
    duration: 30,
    level: "advanced",
    levelLabel: "Avancé",
    category: "cardio",
    image: "images/ex_13_burpees.jpg",
    video: "videos/ex_13_burpees.mp4",
    targetMuscles: "Cardio, Pectoraux, Quadriceps, Sangle abdominale",
    targetPrimary: "CARDIO EXPLOSIF FULL BODY",
    cue: "Squat, pose des mains, saut arrière en planche, retour groupé et impulsion verticale.",
    breathing: "Rythme respiratoire régulier, expirez fort lors du saut vertical.",
    description: "Mouvement polyarticulaire complet combinant squat, saut en planche et impulsion vers le haut pour une dépense calorique maximale.",
    adaptation: "Intermédiaire : Burpees sans saut (Step-back burpees). Avancé : Ajout d'une pompe complète au sol.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 14,
    number: "14",
    name: "RUSSIAN TWISTS",
    subtitle: "Rotation du buste & renforcement des obliques",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "core",
    image: "images/ex_14_russian_twists.jpg",
    video: "videos/ex_14_russian_twists.mp4",
    targetMuscles: "Obliques internes/externes, Grand droit, Transverse",
    targetPrimary: "TAILLE & OBLIQUES",
    cue: "Assis sur les ischions, buste incliné à 45°, pivotez les épaules de gauche à droite sans à-coups.",
    breathing: "Expirez à chaque rotation latérale, inspirez au centre.",
    description: "En équilibre fessier, tournez le torse d'un côté puis de l'autre en touchant le sol de chaque côté pour sculpter la sangle abdominale oblique.",
    adaptation: "Débutant : Talons posés au sol. Avancé : Pieds surélevés décollés du sol avec tempo ralenti.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 15,
    number: "15",
    name: "GAINAGE LATÉRAL",
    subtitle: "Planche latérale & stabilisateurs profonds",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "core",
    image: "images/ex_15_side_plank.jpg",
    video: "videos/ex_15_side_plank.mp4",
    targetMuscles: "Obliques, Moyen fessier, Carré des lombes, Épaules",
    targetPrimary: "OBLIQUES & POSTURE LATÉRALE",
    cue: "Coude aligné sous l'épaule, bassin haut aligné avec la colonne (20s côté droit / 20s côté gauche).",
    breathing: "Respiration fluide et continue sans affaissement du bassin.",
    description: "Appui sur un avant-bras et la tranche des pieds pour renforcer la chaîne latérale et protéger la colonne lombaire.",
    adaptation: "Débutant : Genoux au sol fléchis à 90°. Avancé : Élévation de la jambe supérieure (Star Plank).",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 16,
    number: "16",
    name: "DIPS SUR CHAISE",
    subtitle: "Poussée arrière pour le galbe des triceps",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "upper_body",
    image: "images/ex_16_chair_dips.jpg",
    video: "videos/ex_16_chair_dips.mp4",
    targetMuscles: "Triceps, Deltoïdes antérieurs, Haut du dos",
    targetPrimary: "TRICEPS & ÉPAULES",
    cue: "Mains sur le bord de la chaise, dos rasant l'assise, flexion des coudes à 90°.",
    breathing: "Inspirez à la descente, expirez en repoussant sur les paumes de mains.",
    description: "Dos à une chaise ou table basse solide, descendez le bassin en fléchissant les coudes puis remontez en tendant les bras.",
    adaptation: "Débutant : Genoux fléchis à 90° pieds proches. Avancé : Jambes tendues devant soi ou pieds surélevés.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 17,
    number: "17",
    name: "BICYCLE CRUNCHES",
    subtitle: "Pédalage croisé dynamique des abdominaux",
    duration: 30,
    level: "intermediate",
    levelLabel: "Intermédiaire",
    category: "core",
    image: "images/ex_17_bicycle_crunches.jpg",
    video: "videos/ex_17_bicycle_crunches.mp4",
    targetMuscles: "Grand droit, Obliques, Fléchisseurs de hanche",
    targetPrimary: "ABDOMINAUX COMPLETS",
    cue: "Coude opposé vers genou opposé avec rotation contrôlée des épaules sans tirer sur la nuque.",
    breathing: "Respiration alternée et cadencée avec les changements de côté.",
    description: "Allongé sur le dos, effectuez un pédalage dynamique en amenant alternativement le coude droit vers le genou gauche et inversement.",
    adaptation: "Débutant : Mouvement lent avec pause au sol. Avancé : Cadence accélérée jambes tendues au ras du sol.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 18,
    number: "18",
    name: "MONTÉES DE GENOUX",
    subtitle: "Cardio haute intensité & dynamisme des jambes",
    duration: 30,
    level: "beginner",
    levelLabel: "Tous Niveaux",
    category: "cardio",
    image: "images/ex_18_high_knees.jpg",
    video: "videos/ex_18_high_knees.mp4",
    targetMuscles: "Cardio, Fléchisseurs de hanche, Mollets, Sangle abdominale",
    targetPrimary: "CARDIO & RÉACTIVITÉ",
    cue: "Genoux montés à hauteur de hanches, appuis légers sur pointes de pieds, buste haut.",
    breathing: "Rythme respiratoire profond et dynamique.",
    description: "Course sur place énergique en élevant alternativement les genoux vers la poitrine avec impulsion souple.",
    adaptation: "Débutant : Montées de genoux marchées sans impact. Avancé : Vitesse maximale avec bras actifs.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 19,
    number: "19",
    name: "SUPERMAN EXTENSION",
    subtitle: "Renforcement lombaire, dos & posture",
    duration: 30,
    level: "beginner",
    levelLabel: "Débutant",
    category: "core",
    image: "images/ex_19_superman.jpg",
    video: "videos/ex_19_superman.mp4",
    targetMuscles: "Érecteurs du rachis, Grand fessier, Fixateurs d'omoplates",
    targetPrimary: "DOS & POSTURE",
    cue: "Allongé sur le ventre, décollez simultanément poitrine et cuisses du sol sans forcer sur la nuque.",
    breathing: "Expirez en levant les membres, inspirez en redescendant doucement.",
    description: "Allongé à plat ventre, levez les bras tendus devant et les jambes tendues derrière pour renforcer toute la chaîne postérieure et la posture dorsale.",
    adaptation: "Débutant : Levez un bras et la jambe opposée en alternance. Avancé : Maintien isométrique 3 secondes en position haute.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 20,
    number: "20",
    name: "CHAISE AU MUR",
    subtitle: "Isométrie & endurance des quadriceps",
    duration: 30,
    level: "beginner",
    levelLabel: "Débutant / Intermédiaire",
    category: "lower_body",
    image: "images/ex_20_wall_sit.jpg",
    video: "videos/ex_20_wall_sit.mp4",
    targetMuscles: "Quadriceps, Fessiers, Mollets, Endurance",
    targetPrimary: "ENDURANCE DES CUISSES",
    cue: "Dos parfaitement plaqué au mur, cuisses parallèles au sol à 90°, mains posées sur les cuisses ou le long du corps.",
    breathing: "Respiration ventrale lente et continue sans bloquer.",
    description: "Position statique adossé contre un mur simulant une chaise pour développer l'endurance et la stabilité des genoux sans impact articulaire.",
    adaptation: "Débutant : Angle plus ouvert (cuisses à 45°). Avancé : Chaise sur une seule jambe pendant 20 secondes par côté.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  }
];

// ==========================================================================
// EXERCICES DU PROGRAMME SPÉCIAL 2 HALTÈRES (FULL BODY & CORE)
// 10 mouvements (5 blocs supersets/combos + circuit abdos) + 1 retour au calme
// ==========================================================================
const DUMBBELL_LIVE_EXERCISES = [
  {
    id: 101,
    number: "01",
    code: "1A",
    name: "DÉVELOPPÉ COUCHÉ ALTERNÉ",
    subtitle: "Pectoraux & Triceps • 2 Haltères",
    duration: 40,
    level: "intermediate",
    levelLabel: "2 Haltères",
    category: "upper_body",
    categoryTag: "Pectoraux & Triceps",
    badgeClass: "badge-blue",
    equipment: "2 Haltères + Tapis",
    equipmentIcon: "🏋️‍♂️",
    image: "images/ex_db_1_bench_press.jpg",
    video: "videos/ex_db_1_bench_press.mp4",
    targetMuscles: "Pectoraux, Deltoïdes antérieurs, Triceps, Gainage",
    targetPrimary: "PECTORAUX & TRICEPS",
    cue: "Omoplates serrées au sol, alternez la poussée bras droit puis bras gauche en contrôlant la descente à 45°.",
    breathing: "Inspirez à la descente d'un haltère, expirez puissamment lors de la poussée vers le haut.",
    description: "Allongé sur le dos au sol ou sur banc. Poussez les deux haltères vers le ciel. Tout en gardant un bras verrouillé au sommet, descendez l'autre haltère sous contrôle jusqu'à ce que le bras forme un angle de 45° avec le torse, puis remontez en poussant fort. Alternez immédiatement avec le côté opposé.",
    adaptation: "Charge modérée à lourde (8 à 15 kg). Verrouillez les abdos pour éviter toute rotation du bassin.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 102,
    number: "02",
    code: "1B",
    name: "ROWING BUSTE PENCHÉ",
    subtitle: "Grand Dorsal & Dos • 2 Haltères",
    duration: 40,
    level: "intermediate",
    levelLabel: "2 Haltères",
    category: "upper_body",
    categoryTag: "Grand Dorsal & Dos",
    badgeClass: "badge-cyan",
    equipment: "2 Haltères",
    equipmentIcon: "🏋️‍♂️",
    image: "images/ex_db_2_rowing.jpg",
    video: "videos/ex_db_2_rowing.mp4",
    targetMuscles: "Grand Dorsal, Trapèzes, Rhomboïdes, Biceps",
    targetPrimary: "GRAND DORSAL & DOS",
    cue: "Buste penché à 45°, dos rigoureusement plat, tirez les coudes vers les hanches en resserrant les omoplates.",
    breathing: "Expirez en tirant les haltères vers l'arrière, inspirez en redescendant sous contrôle.",
    description: "Debout, pieds écartés largeur d'épaules, buste incliné en avant à 45°, genoux déverrouillés. Tirez simultanément les deux haltères vers vos hanches en resserrant les omoplates, marquez une contraction d'une seconde puis relâchez lentement.",
    adaptation: "Ne donnez aucun à-coup de rein. Si le bas du dos fatigue, réduisez légèrement la charge.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 103,
    number: "03",
    code: "2A",
    name: "RELEVÉ TRICEPS AU-DESSUS TÊTE",
    subtitle: "Triceps Chef Long • 1 ou 2 Haltères",
    duration: 35,
    level: "intermediate",
    levelLabel: "1-2 Haltères",
    category: "upper_body",
    categoryTag: "Triceps (Chef Long)",
    badgeClass: "badge-purple",
    equipment: "1 ou 2 Haltères",
    equipmentIcon: "🏋️",
    image: "images/ex_db_3_overhead_triceps.jpg",
    video: "videos/ex_db_3_overhead_triceps.mp4",
    targetMuscles: "Triceps (faisceau long et latéral)",
    targetPrimary: "TRICEPS",
    cue: "Coudes serrés et pointés vers l'avant, descendez l'haltère derrière la tête sans écarter les coudes.",
    breathing: "Inspirez lors de la descente derrière la nuque, expirez en tendant les avant-bras vers le plafond.",
    description: "Debout ou assis, tenez un haltère lourd à deux mains bras tendus vers le ciel. Fléchissez les avant-bras pour étirer profondément les triceps puis remontez en poussant verticalement sans verrouiller brutalement.",
    adaptation: "Maintenez le nombril aspiré pour éviter de cambrer le bas du dos.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 104,
    number: "04",
    code: "2B",
    name: "POMPES DIAMANT AU SOL",
    subtitle: "Triceps & Centre Pectoraux • Poids du corps",
    duration: 30,
    level: "advanced",
    levelLabel: "Poids du corps",
    category: "upper_body",
    categoryTag: "Triceps & Pectoraux",
    badgeClass: "badge-indigo",
    equipment: "Poids du corps / Tapis",
    equipmentIcon: "🤸",
    image: "images/ex_db_4_diamond_pushups.jpg",
    video: "videos/ex_db_4_diamond_pushups.mp4",
    targetMuscles: "Triceps, Pectoraux sternaux, Deltoïdes antérieurs, Gainage",
    targetPrimary: "TRICEPS & POITRINE",
    cue: "Mains en losange sous le sternum, coudes longeant les côtes, corps parfaitement aligné.",
    breathing: "Inspirez en descendant la poitrine sur les mains, expirez vigoureusement en repoussant.",
    description: "En appui facial, pouces et index formant un diamant. Descendez la poitrine au contact des mains puis repoussez avec force en ciblant les triceps.",
    adaptation: "Possibilité de poser les genoux au sol tout en maintenant le bassin verrouillé pour compléter la série.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 105,
    number: "05",
    code: "03",
    name: "ÉLÉVATIONS LATÉRALES & FRONTALES",
    subtitle: "Deltoïdes 3D • 2 Haltères",
    duration: 40,
    level: "intermediate",
    levelLabel: "2 Haltères",
    category: "upper_body",
    categoryTag: "Deltoïdes Latéral & Antérieur",
    badgeClass: "badge-pink",
    equipment: "2 Haltères",
    equipmentIcon: "🏋️‍♂️",
    image: "images/ex_db_5_lateral_front_raises.jpg",
    video: "videos/ex_db_5_lateral_front_raises.mp4",
    targetMuscles: "Deltoïdes latéraux, Deltoïdes antérieurs, Trapèzes",
    targetPrimary: "ÉPAULES 3D",
    cue: "Élevez sur les côtés à hauteur d'épaules, redescendez doucement, puis élevez droit devant vous.",
    breathing: "Expirez à chaque montée, inspirez lors des descentes freinées.",
    description: "Combo sans temps mort associant une élévation latérale pour la largeur d'épaules et une élévation frontale pour le galbe avant. Gardez une posture rigide sans balancement.",
    adaptation: "Charges modérées pour éviter les compensations et garder les trapèzes relâchés.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 106,
    number: "06",
    code: "4A",
    name: "FENTES BULGARES SURÉLEVÉES",
    subtitle: "Quadriceps & Fessiers • 2 Haltères",
    duration: 40,
    level: "intermediate",
    levelLabel: "2 Haltères + Chaise",
    category: "lower_body",
    categoryTag: "Quadriceps & Fessiers",
    badgeClass: "badge-emerald",
    equipment: "2 Haltères + Chaise ou Banc",
    equipmentIcon: "🪑",
    image: "images/ex_db_6_bulgarian_squats.jpg",
    video: "videos/ex_db_6_bulgarian_squats.mp4",
    targetMuscles: "Grand Fessier, Quadriceps, Ischios, Stabilité",
    targetPrimary: "FESSIERS & CUISSES",
    cue: "Pied arrière surélevé sur la chaise, descendez la cuisse avant parallèle au sol et repoussez fort sur le talon.",
    breathing: "Inspirez en descendant dans la fente, expirez en remontant.",
    description: "Travail unilatéral d'élite. 80% du poids repose sur la jambe avant. Mi-temps à 20s pour changer de jambe sous le signal sonore.",
    adaptation: "Commencez sans haltères si l'équilibre est précaire, puis chargez progressivement.",
    isDumbbell: true,
    isUnilateral: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 107,
    number: "07",
    code: "4B",
    name: "SQUATS COMPLETS AUX HALTÈRES",
    subtitle: "Force globale Bas du corps • 2 Haltères",
    duration: 40,
    level: "intermediate",
    levelLabel: "2 Haltères",
    category: "lower_body",
    categoryTag: "Quadriceps, Fessiers & Ischios",
    badgeClass: "badge-green",
    equipment: "2 Haltères",
    equipmentIcon: "🏋️‍♂️",
    image: "images/ex_db_7_dumbbell_squats.jpg",
    video: "videos/ex_db_7_dumbbell_squats.mp4",
    targetMuscles: "Quadriceps, Grand Fessier, Ischio-jambiers, Lombaires",
    targetPrimary: "CUISSES & FESSIERS",
    cue: "Pieds largeur d'épaules, poitrine bombée, descendez les hanches sous le niveau des genoux et poussez par les talons.",
    breathing: "Inspirez à la descente en ouvrant les genoux, expirez énergiquement à la remontée.",
    description: "Haltères calés sur les épaules en Front Rack ou le long du corps. Descente complète et contrôlée pour un recrutement musculaire profond.",
    adaptation: "Maintenez les genoux alignés sur les pointes de pieds sans les laisser s'effondrer vers l'intérieur.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 108,
    number: "08",
    code: "05",
    name: "CURL BICEPS EN SUPINATION",
    subtitle: "Isolation Biceps Brachial • 2 Haltères",
    duration: 35,
    level: "intermediate",
    levelLabel: "2 Haltères",
    category: "upper_body",
    categoryTag: "Biceps Brachial & Avant-bras",
    badgeClass: "badge-amber",
    equipment: "2 Haltères",
    equipmentIcon: "🏋️‍♂️",
    image: "images/ex_db_8_biceps_curls.jpg",
    video: "videos/ex_db_8_biceps_curls.mp4",
    targetMuscles: "Biceps Brachial, Brachio-radial, Avant-bras",
    targetPrimary: "BICEPS",
    cue: "Coudes fixés aux côtes, pivotez les paumes vers l'extérieur au sommet pour un pic de contraction maximal.",
    breathing: "Expirez en montant les haltères en rotation, inspirez lors de la descente freinée sur 2 secondes.",
    description: "Prise neutre au départ le long des cuisses, rotation externe progressive des poignets durant la montée, puis descente lente et contrôlée.",
    adaptation: "Bannissez tout balancement du dos : verrouillez les fessiers et le tronc.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 109,
    number: "09",
    code: "06",
    name: "RUSSIAN TWIST AVEC HALTÈRE",
    subtitle: "Obliques & Rotation du buste • 1 Haltère",
    duration: 35,
    level: "intermediate",
    levelLabel: "1 Haltère",
    category: "core",
    categoryTag: "Obliques & Grand Droit",
    badgeClass: "badge-orange",
    equipment: "1 Haltère + Tapis",
    equipmentIcon: "🏋️",
    image: "images/ex_db_9_russian_twist.jpg",
    video: "videos/ex_db_9_russian_twist.mp4",
    targetMuscles: "Obliques internes/externes, Grand Droit, Fléchisseurs de hanche",
    targetPrimary: "OBLIQUES & CORE",
    cue: "Buste incliné à 45°, faites pivoter l'haltère d'un côté à l'autre en tournant tout le torse.",
    breathing: "Expirez à chaque rotation latérale, inspirez lors du passage rapide au centre.",
    description: "Assis au sol, pieds au sol ou décollés de 5 cm. Tenez l'haltère à deux mains et pivotez le torse avec amplitude et retenue.",
    adaptation: "Décollez les pieds pour augmenter la difficulté et le travail du droit de l'abdomen.",
    isDumbbell: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 110,
    number: "10",
    code: "07",
    name: "PLANCHE CLASSIQUE GAINAGE",
    subtitle: "Transverse & Stabilité Profonde • Poids du corps",
    duration: 45,
    level: "intermediate",
    levelLabel: "Poids du corps",
    category: "core",
    categoryTag: "Transverse & Stabilité",
    badgeClass: "badge-teal",
    equipment: "Poids du corps / Tapis",
    equipmentIcon: "🤸",
    image: "images/ex_db_10_plank.jpg",
    video: "videos/ex_db_10_plank.mp4",
    targetMuscles: "Transverse, Grand Droit, Érecteurs du rachis, Fessiers",
    targetPrimary: "GAINAGE PROFOND",
    cue: "Avant-bras au sol, nombril aspiré, corps droit comme une flèche, fessiers et abdos verrouillés.",
    breathing: "Respiration ventrale lente et continue sans bloquer l'inspiration.",
    description: "Maintien isométrique sur les avant-bras et les orteils pour verrouiller la colonne et affiner la taille.",
    adaptation: "Rétroversez le bassin pour protéger le bas du dos.",
    isDumbbell: true,
    isPlank: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 111,
    number: "11",
    code: "FIN",
    name: "ÉTIREMENTS & RETOUR AU CALME",
    subtitle: "Décompression musculaire & Récupération",
    duration: 45,
    level: "beginner",
    levelLabel: "Tous Niveaux",
    category: "cooldown",
    categoryTag: "Récupération Globale",
    badgeClass: "badge-emerald",
    equipment: "Tapis",
    equipmentIcon: "🧘",
    image: "images/ex_db_11_stretching.jpg",
    video: "videos/ex_db_11_stretching.mp4",
    targetMuscles: "Pectoraux, Dos, Cuisses, Fessiers, Épaules",
    targetPrimary: "RÉCUPÉRATION",
    cue: "Baissez le rythme cardiaque, allongez la colonne et respirez profondément par le nez.",
    breathing: "Inspirations profondes et longues expirations relâchées.",
    description: "Étirements complets pour soulager les tensions accumulées pendant la séance avec les haltères.",
    adaptation: "Ne forcez jamais au-delà de la zone de confort articulaire.",
    isDumbbell: true,
    isCoolDown: true,
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  }
];

// Routines prédéfinies par niveau d'utilisateur (Programme Poids du Corps)
const ROUTINES_BY_LEVEL = {
  beginner: [1, 2, 11, 6, 19, 20, 8, 9], // 7 exercices adaptés + étirements
  intermediate: [1, 2, 3, 4, 6, 5, 16, 8, 9], // 8 exercices équilibrés (Pont fessier inclus) + étirements
  advanced: [18, 2, 12, 13, 14, 5, 15, 8, 9] // 8 exercices intensifs + étirements
};

// Fonctions utilitaires d'accès aux exercices
function getAllExercises() {
  return [...EXERCISES_DATA, ...DUMBBELL_LIVE_EXERCISES];
}

function getExerciseById(id) {
  const numId = Number(id);
  const found = EXERCISES_DATA.find(e => e.id === numId);
  if (found) return found;
  return DUMBBELL_LIVE_EXERCISES.find(e => e.id === numId) || null;
}

function getExercisesForLevel(level = 'intermediate') {
  const ids = ROUTINES_BY_LEVEL[level] || ROUTINES_BY_LEVEL.intermediate;
  return ids.map(id => getExerciseById(id)).filter(Boolean);
}

function getDumbbellWorkoutExercises() {
  return DUMBBELL_LIVE_EXERCISES;
}

function getActiveWorkoutExercises(prefs = {}) {
  const workoutMode = prefs.workoutMode || 'bodyweight';
  if (workoutMode === 'dumbbells') {
    return DUMBBELL_LIVE_EXERCISES;
  }

  const userLevel = prefs.userLevel || 'intermediate';
  if (userLevel === 'custom' && Array.isArray(prefs.customExerciseIds) && prefs.customExerciseIds.length > 0) {
    const list = prefs.customExerciseIds.map(id => getExerciseById(id)).filter(Boolean);
    if (list.length === 0) {
      return getExercisesForLevel('intermediate');
    }
    // Isoler le circuit principal et toujours positionner le retour au calme (ID 9) en étape finale
    const mainCircuit = list.filter(e => !e.isCoolDown);
    const coolDown = getExerciseById(9);
    if (coolDown) {
      return [...mainCircuit, coolDown];
    }
    return mainCircuit;
  }
  return getExercisesForLevel(userLevel);
}

// Structure du plan d'entraînement sur 8 semaines
const PROGRAM_WEEKS = [
  { weeks: "Semaines 1-2", rounds: 2, title: "Prise en main & Régularité", desc: "2 tours complets à intensité modérée pour ancrer le rendez-vous de 17h." },
  { weeks: "Semaines 3-4", rounds: 2, title: "Qualité d'exécution & Abdominaux", desc: "2 tours avec amplitude complète et contrôle parfait du gainage et des abdos." },
  { weeks: "Semaines 5-6", rounds: 2, title: "Augmentation d'intensité", desc: "2 tours plus rythmés avec progression sur la durée du gainage (45s à 60s)." },
  { weeks: "Semaines 7-8", rounds: 3, title: "Passage au Niveau Supérieur", desc: "Possibilité d'activer 3 tours pour une séance complète avec renforcement abdominal renforcé." }
];

window.EXERCISES_DATA = EXERCISES_DATA;
window.DUMBBELL_LIVE_EXERCISES = DUMBBELL_LIVE_EXERCISES;
window.ROUTINES_BY_LEVEL = ROUTINES_BY_LEVEL;
window.getAllExercises = getAllExercises;
window.getExerciseById = getExerciseById;
window.getExercisesForLevel = getExercisesForLevel;
window.getDumbbellWorkoutExercises = getDumbbellWorkoutExercises;
window.getActiveWorkoutExercises = getActiveWorkoutExercises;
window.PROGRAM_WEEKS = PROGRAM_WEEKS;

