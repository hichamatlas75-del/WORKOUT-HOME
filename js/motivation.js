/**
 * FULL BODY 17 — SYSTÈME DE MOTIVATION, BADGES & CONFETTIS
 * Système sobre et valorisant pour encourager la régularité quotidienne.
 */

const BADGES_DEFINITIONS = [
  {
    id: 'first_step',
    icon: '🌟',
    title: 'Premier Pas',
    desc: 'Compléter votre toute 1ère séance Full Body.',
    check: (stats) => stats.totalWorkouts >= 1
  },
  {
    id: 'streak_1',
    icon: '⚡',
    title: '1 Jour Validé',
    desc: 'Valider la séance du jour et démarrer une série active.',
    check: (stats) => stats.currentStreak >= 1
  },
  {
    id: 'streak_3',
    icon: '🔥',
    title: 'Régularité (3 jours)',
    desc: 'Enchaîner 3 jours consécutifs d’entraînement.',
    check: (stats) => stats.bestStreak >= 3 || stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    icon: '🏆',
    title: 'Guerrier Hebdo (7 jours)',
    desc: '7 jours consécutifs de routine Full Body sans interruption.',
    check: (stats) => stats.bestStreak >= 7 || stats.currentStreak >= 7
  },
  {
    id: 'streak_14',
    icon: '🛡️',
    title: 'Habitude d’Acier (14 jours)',
    desc: '2 semaines complètes de discipline quotidienne.',
    check: (stats) => stats.bestStreak >= 14 || stats.currentStreak >= 14
  },
  {
    id: 'master_30',
    icon: '👑',
    title: 'Légende 30 Séances',
    desc: 'Atteindre le cap symbolique des 30 séances terminées.',
    check: (stats) => stats.totalWorkouts >= 30
  },
  {
    id: 'punctual_17',
    icon: '⏰',
    title: 'Rendez-vous 17h',
    desc: 'Effectuer sa séance entre 16h30 et 18h00.',
    check: (stats, session) => {
      if (!session) return false;
      const hour = new Date(session.timestamp).getHours();
      const min = new Date(session.timestamp).getMinutes();
      return (hour === 16 && min >= 30) || (hour === 17) || (hour === 18 && min <= 15);
    }
  },
  {
    id: 'triple_round',
    icon: '💪',
    title: 'Force 3 Tours',
    desc: 'Terminer une séance complète de 3 tours (Progression Semaines 7-8).',
    check: (stats, session) => session && session.rounds >= 3
  }
];

class MotivationManager {
  constructor() {
    this.confettiAnimationId = null;
  }

  // Évaluation des badges débloqués après une séance
  checkAndUnlockBadges(lastSession) {
    const totalWorkouts = window.appStorage.getTotalWorkouts();
    const streakStats = window.appStorage.getStreakStats();

    const stats = {
      totalWorkouts,
      currentStreak: streakStats.currentStreak,
      bestStreak: streakStats.bestStreak
    };

    const newlyUnlocked = [];

    BADGES_DEFINITIONS.forEach(badge => {
      const isAlreadyUnlocked = window.appStorage.badges.includes(badge.id);
      if (!isAlreadyUnlocked && badge.check(stats, lastSession)) {
        window.appStorage.unlockBadge(badge.id);
        newlyUnlocked.push(badge);
      }
    });

    return newlyUnlocked;
  }

  // Rendu de la grille des badges dans la vue Badges
  renderBadgesView() {
    const container = document.getElementById('badges-grid-container');
    if (!container) return;

    const unlockedList = window.appStorage.loadBadges();

    container.innerHTML = BADGES_DEFINITIONS.map(badge => {
      const isUnlocked = unlockedList.includes(badge.id);
      return `
        <div class="badge-card ${isUnlocked ? 'unlocked' : ''}">
          <div class="badge-icon-box">${badge.icon}</div>
          <div class="badge-title">${badge.title}</div>
          <div class="badge-desc">${badge.desc}</div>
          ${isUnlocked ? '<div class="status-pill" style="margin-top: 8px; font-size: 0.68rem; padding: 2px 8px;">DÉBLOQUÉ</div>' : ''}
        </div>
      `;
    }).join('');
  }

  // Lancement de l'animation de confettis en Canvas pur
  launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // Ajuster pour les écrans haute densité (Retina, AMOLED)
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);

    const particles = [];
    const colors = ['#10b981', '#06b6d4', '#fbbf24', '#f59e0b', '#ec4899', '#ffffff'];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: (canvas.width / dpr) * 0.5,
        y: (canvas.height / dpr) * 0.4,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        gravity: 0.35,
        drag: 0.96,
        alpha: 1
      });
    }

    if (this.confettiAnimationId) cancelAnimationFrame(this.confettiAnimationId);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      particles.forEach(p => {
        p.vx *= p.drag;
        p.vy = (p.vy + p.gravity) * p.drag;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha -= 0.005;

        if (p.alpha > 0) {
          activeCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (activeCount > 0) {
        this.confettiAnimationId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  }

  stopConfetti() {
    if (this.confettiAnimationId) {
      cancelAnimationFrame(this.confettiAnimationId);
      this.confettiAnimationId = null;
    }
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
}

window.motivationManager = new MotivationManager();
