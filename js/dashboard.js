/**
 * FULL BODY 17 — TABLEAU DE BORD & CALENDRIER D'ACTIVITÉ
 * Gestion des statistiques d'entraînement, séries et calendrier interactif.
 */

class DashboardManager {
  constructor() {
    this.currentCalendarDate = new Date();
  }

  // Rendu complet du tableau de bord
  renderDashboard() {
    this.renderMetrics();
    this.renderCalendar();
    this.renderProgressionPlan();
  }

  // Cartes d'indicateurs de performance
  renderMetrics() {
    const totalWorkouts = window.appStorage.getTotalWorkouts();
    const totalMinutes = window.appStorage.getTotalTrainingMinutes();
    const workoutsThisMonth = window.appStorage.getWorkoutsThisMonth();
    const streakStats = window.appStorage.getStreakStats();

    const elTotal = document.getElementById('stat-total-workouts');
    if (elTotal) elTotal.textContent = totalWorkouts;

    const elStreak = document.getElementById('stat-current-streak');
    if (elStreak) elStreak.textContent = streakStats.currentStreak;

    const elBestStreak = document.getElementById('stat-best-streak');
    if (elBestStreak) elBestStreak.textContent = streakStats.bestStreak;

    const elTime = document.getElementById('stat-total-time');
    if (elTime) elTime.textContent = totalMinutes;

    const elMonth = document.getElementById('stat-month-workouts');
    if (elMonth) elMonth.textContent = workoutsThisMonth;

    // Statut sur la page d'accueil
    const homeStreakPill = document.getElementById('home-streak-pill');
    if (homeStreakPill) {
      if (streakStats.currentStreak > 0) {
        homeStreakPill.innerHTML = `<span class="pulse-dot"></span> Série : ${streakStats.currentStreak} ${streakStats.currentStreak > 1 ? 'jours' : 'jour'}`;
      } else {
        homeStreakPill.innerHTML = `<span class="pulse-dot"></span> Prêt pour la séance`;
      }
    }
  }

  // Rendu du calendrier Heatmap mensuel interactif
  renderCalendar() {
    const calendarGrid = document.getElementById('calendar-days-grid');
    const monthTitle = document.getElementById('calendar-month-title');
    if (!calendarGrid || !monthTitle) return;

    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    monthTitle.textContent = `${monthNames[month]} ${year}`;

    // Carte des séances par date
    const workoutMap = window.appStorage.getWorkoutsByDateMap();
    const todayStr = window.appStorage.formatDateISO(new Date());

    calendarGrid.innerHTML = '';

    // Premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajuster pour débuter le Lundi (Lundi = 0, Dimanche = 6)
    const startingBlankDays = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);

    // Nombre de jours dans le mois
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    // Cases vides au début
    for (let i = 0; i < startingBlankDays; i++) {
      const blankCell = document.createElement('div');
      blankCell.className = 'cal-day empty';
      calendarGrid.appendChild(blankCell);
    }

    // Jours du mois
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const dateStr = window.appStorage.formatDateISO(dayDate);
      const isCompleted = workoutMap[dateStr] && workoutMap[dateStr] > 0;
      const isToday = dateStr === todayStr;

      const dayCell = document.createElement('div');
      dayCell.className = 'cal-day';
      if (isToday) dayCell.classList.add('today');
      if (isCompleted) dayCell.classList.add('completed');

      dayCell.textContent = day;

      // Clic pour inspecter la séance du jour
      dayCell.addEventListener('click', () => {
        this.showDayDetail(dateStr, isCompleted, workoutMap[dateStr] || 0);
      });

      calendarGrid.appendChild(dayCell);
    }
  }

  // Navigation calendrier
  prevMonth() {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
    this.renderCalendar();
  }

  // Détail d'une journée
  showDayDetail(dateStr, isCompleted, count) {
    const formattedDate = new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    if (isCompleted) {
      showToast(`🗓️ ${formattedDate} — ✅ ${count} séance(s) validée(s) !`);
    } else {
      showToast(`🗓️ ${formattedDate} — Aucune séance ce jour.`);
    }
  }

  // Affichage du plan de programmation 8 semaines
  renderProgressionPlan() {
    const container = document.getElementById('progression-plan-list');
    if (!container) return;

    const totalWorkouts = window.appStorage.getTotalWorkouts();
    // Déterminer la phase en cours (approx: 14 séances par palier de 2 semaines)
    let currentStepIndex = 0;
    if (totalWorkouts >= 14 && totalWorkouts < 28) currentStepIndex = 1;
    else if (totalWorkouts >= 28 && totalWorkouts < 42) currentStepIndex = 2;
    else if (totalWorkouts >= 42) currentStepIndex = 3;

    container.innerHTML = PROGRAM_WEEKS.map((step, idx) => `
      <div class="plan-step-item ${idx === currentStepIndex ? 'active' : ''}">
        <div>
          <div class="plan-step-title">${step.weeks} • ${step.title}</div>
          <div class="plan-step-desc">${step.desc}</div>
        </div>
        <div class="status-pill" style="font-size: 0.72rem; padding: 3px 8px;">
          ${step.rounds} tours
        </div>
      </div>
    `).join('');
  }
}

window.dashboardManager = new DashboardManager();
