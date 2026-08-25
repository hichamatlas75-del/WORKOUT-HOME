/**
 * FULL BODY 17 — BASE D'EXERCICES ET LECTEUR VIDÉO RÉEL HD
 * Rendu vidéo réel en boucle avec fallback image automatique.
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
          <canvas aria-label="Animation de l\'exercice ${ex.name}"></canvas>
          <span class="offline-video-chip">📵 Animation hors ligne</span>
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
    duration: 40,
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
    duration: 40,
    image: "images/ex_2_squat.jpg",
    video: "videos/ex_2_squat.mp4",
    targetMuscles: "Quadriceps, Ischio-jambiers, Fessiers, Gainage",
    targetPrimary: "QUADRICEPS & FESSIERS",
    cue: "Pieds largeur d'épaules, genoux alignés avec les pointes de pieds, buste fier et regard vers l'avant.",
    breathing: "Inspirez à la descente, expirez en repoussant le sol par les talons.",
    description: "Fléchir les genoux en envoyant les hanches vers l'arrière comme pour s'asseoir sur une chaise. Descendez jusqu'à ce que les cuisses soient parallèles au sol.",
    adaptation: "Débutant : Faites le mouvement en effleurant une vraie chaise derrière vous. Avancé : Marquez 1 seconde de pause en position basse.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 3,
    number: "03",
    name: "POMPES AU SOL",
    subtitle: "Poussée pectorale & gainage actif",
    duration: 40,
    image: "images/ex_3_pushups.jpg",
    video: "videos/ex_3_pushups.mp4",
    targetMuscles: "Pectoraux, Triceps, Deltoïdes antérieurs, Abdominaux",
    targetPrimary: "PECTORAUX & TRICEPS",
    cue: "Corps parfaitement gainé en planche, coudes à 45° du corps, nuque neutre.",
    breathing: "Inspirez en descendant la poitrine vers le sol, expirez en repoussant.",
    description: "En appui facial, mains légèrement plus écartées que les épaules. Gardez les abdominaux et les fessiers contractés sans creuser le bas du dos.",
    adaptation: "Débutant : Posez les genoux au sol ou faites les pompes inclinées contre une table solide. Avancé : Pompes classiques au sol avec descente ralentie en 3 secondes.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 4,
    number: "04",
    name: "CRUNCH & SCISSOR KICKS",
    subtitle: "Combo Abdominaux : haut & bas du ventre",
    duration: 40,
    image: "images/ex_4_crunch_scissor.jpg",
    video: "videos/ex_4_crunch_scissor.mp4",
    targetMuscles: "Grand droit, Abdominaux inférieurs, Obliques, Psoas",
    targetPrimary: "GRAND DROIT & ABDOS BAS",
    cue: "Bas du dos bien plaqué au sol, nombril rentré, jambes tendues et ciseaux contrôlés.",
    breathing: "Expirez lors de l'effort et de la contraction, inspirez régulièrement.",
    description: "Allongé sur le dos sur tapis : enroulement contrôlé du haut du buste combiné à des battements de jambes alternés en ciseaux (Scissor Kicks) pour un recrutement complet des abdominaux.",
    adaptation: "Débutant : Mains sous les fessiers pour soulager les lombaires et ciseaux plus hauts. Avancé : Épaules constamment décollées, jambes ras du sol.",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 5,
    number: "05",
    name: "MOUNTAIN CLIMBERS",
    subtitle: "Cardio dynamique & sangle abdominale",
    duration: 40,
    image: "images/ex_mountain_climbers.jpg",
    video: "videos/ex_mountain_climbers.mp4",
    targetMuscles: "Grand droit, Fléchisseurs de hanches, Épaules, Cardio",
    targetPrimary: "CARDIO & ABDOMINAUX",
    cue: "Dos plat aligné en planche, mains sous les épaules, ramenez les genoux vers la poitrine avec rythme.",
    breathing: "Respiration rythmée et dynamique en accord avec les montées de genoux.",
    description: "En position de pompe haute, amenez alternativement et rapidement les genoux vers le buste en gardant les abdominaux gainés et les hanches stables à hauteur d'épaules.",
    adaptation: "Débutant : Version pas à pas lente et contrôlée sans impulsion. Avancé : Vitesse maximale ou genoux croisés vers le coude opposé (Cross Climbers).",
    get illustrationHtml() {
      return renderExerciseMediaHtml(this);
    }
  },
  {
    id: 6,
    number: "06",
    name: "PONT FESSIER",
    subtitle: "Extension pelvienne & chaîne postérieure",
    duration: 40,
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
    duration: 40,
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
    duration: 40,
    isCoolDown: true,
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
  }
];

// Structure du plan d'entraînement sur 8 semaines
const PROGRAM_WEEKS = [
  { weeks: "Semaines 1-2", rounds: 2, title: "Prise en main & Régularité", desc: "2 tours complets à intensité modérée pour ancrer le rendez-vous de 17h." },
  { weeks: "Semaines 3-4", rounds: 2, title: "Qualité d'exécution & Abdominaux", desc: "2 tours avec amplitude complète et contrôle parfait du gainage et des abdos." },
  { weeks: "Semaines 5-6", rounds: 2, title: "Augmentation d'intensité", desc: "2 tours plus rythmés avec progression sur la durée du gainage (45s à 60s)." },
  { weeks: "Semaines 7-8", rounds: 3, title: "Passage au Niveau Supérieur", desc: "Possibilité d'activer 3 tours pour une séance complète avec renforcement abdominal renforcé." }
];
