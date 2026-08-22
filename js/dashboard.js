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
    this.renderWeightTracker();
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
    // Utiliser midi (T12:00:00) pour éviter le décalage UTC sur les fuseaux en avance ou en retard
    const formattedDate = new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
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

  // Rendu du module de Suivi du Poids & Évolution
  renderWeightTracker() {
    const stats = window.appStorage.getWeightStats();
    const history = window.appStorage.weightHistory || [];

    const elCurrent = document.getElementById('weight-current-val');
    const elDelta = document.getElementById('weight-delta-val');
    const elTarget = document.getElementById('weight-target-val');
    const elBmi = document.getElementById('weight-bmi-val');
    const elBmiCategory = document.getElementById('weight-bmi-category');
    const chartContainer = document.getElementById('weight-chart-container');
    const historyList = document.getElementById('weight-history-list');

    if (elCurrent) {
      elCurrent.textContent = stats.currentWeight ? `${stats.currentWeight} kg` : '-- kg';
    }

    if (elDelta) {
      if (stats.hasData && stats.delta !== 0) {
        elDelta.textContent = stats.deltaFormatted;
        elDelta.style.color = stats.delta < 0 ? 'var(--accent-work)' : 'var(--accent-rest)';
      } else {
        elDelta.textContent = '0.0 kg';
        elDelta.style.color = 'var(--text-secondary)';
      }
    }

    if (elTarget) {
      if (stats.targetWeight) {
        const diffStr = stats.targetDiff !== null ? ` (${stats.targetDiff > 0 ? '+' : ''}${stats.targetDiff} kg)` : '';
        elTarget.textContent = `${stats.targetWeight} kg${diffStr}`;
      } else {
        elTarget.textContent = 'Non défini';
      }
    }

    if (elBmi && elBmiCategory) {
      if (stats.bmi) {
        elBmi.textContent = `${stats.bmi.value}`;
        elBmiCategory.textContent = stats.bmi.category;
        elBmiCategory.style.color = `var(${stats.bmi.colorVar})`;
      } else {
        elBmi.textContent = '--';
        elBmiCategory.textContent = 'Renseignez taille';
        elBmiCategory.style.color = 'var(--text-muted)';
      }
    }

    // Graphique SVG interactif
    if (chartContainer) {
      if (history.length >= 2) {
        chartContainer.innerHTML = this.generateWeightChartSvg(history, stats.targetWeight);
      } else if (history.length === 1) {
        chartContainer.innerHTML = `
          <div class="weight-chart-placeholder">
            <span>⚖️ 1ère pesée enregistrée (<strong>${history[0].weight} kg</strong>). Ajoutez une 2ème pesée pour afficher la courbe d'évolution.</span>
          </div>
        `;
      } else {
        chartContainer.innerHTML = `
          <div class="weight-chart-placeholder">
            <span>📈 Aucune pesée enregistrée. Cliquez sur <strong>+ Pesée</strong> pour démarrer votre suivi.</span>
          </div>
        `;
      }
    }

    // Liste des dernières pesées
    if (historyList) {
      if (history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 12px;">Aucun relevé de poids pour le moment.</div>';
      } else {
        const recentEntries = [...history].reverse().slice(0, 5);
        historyList.innerHTML = recentEntries.map((entry, idx) => {
          const dateObj = new Date(entry.date + 'T12:00:00');
          const formattedDate = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          const prevEntry = recentEntries[idx + 1];
          let diffBadge = '';
          if (prevEntry) {
            const diff = Math.round((entry.weight - prevEntry.weight) * 10) / 10;
            if (diff !== 0) {
              const diffText = (diff > 0 ? '+' : '') + diff.toFixed(1) + ' kg';
              const diffColor = diff < 0 ? 'var(--accent-work)' : 'var(--accent-rest)';
              diffBadge = `<span style="font-size: 0.75rem; font-weight: 800; color: ${diffColor}; margin-left: 6px;">(${diffText})</span>`;
            }
          }

          return `
            <div class="weight-log-item">
              <div class="weight-log-left">
                <span class="weight-log-date">📅 ${formattedDate}</span>
                <span class="weight-log-weight">${entry.weight} kg ${diffBadge}</span>
                ${entry.note ? `<span class="weight-log-note">« ${entry.note} »</span>` : ''}
              </div>
              <button class="weight-log-del-btn" onclick="deleteWeightLog('${entry.id}')" title="Supprimer cette pesée" aria-label="Supprimer">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          `;
        }).join('');
      }
    }
  }

  generateWeightChartSvg(history, targetWeight) {
    const width = 320;
    const height = 110;
    const padding = { top: 18, right: 18, bottom: 20, left: 32 };

    const weights = history.map(h => h.weight);
    if (targetWeight) weights.push(targetWeight);

    const minW = Math.floor(Math.min(...weights) - 0.5);
    const maxW = Math.ceil(Math.max(...weights) + 0.5);
    const range = (maxW - minW) || 1;

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    const getX = (idx) => padding.left + (idx / (history.length - 1)) * plotWidth;
    const getY = (val) => padding.top + plotHeight - ((val - minW) / range) * plotHeight;

    const points = history.map((h, i) => `${getX(i).toFixed(1)},${getY(h.weight).toFixed(1)}`).join(' ');
    const areaPoints = `${padding.left},${padding.top + plotHeight} ` + points + ` ${padding.left + plotWidth},${padding.top + plotHeight}`;

    let targetLine = '';
    if (targetWeight && targetWeight >= minW && targetWeight <= maxW) {
      const targetY = getY(targetWeight).toFixed(1);
      targetLine = `
        <line x1="${padding.left}" y1="${targetY}" x2="${padding.left + plotWidth}" y2="${targetY}" stroke="var(--accent-gold)" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.85"/>
        <text x="${padding.left + plotWidth}" y="${targetY - 3}" fill="var(--accent-gold)" font-size="8.5" text-anchor="end" font-weight="700">Cible : ${targetWeight} kg</text>
      `;
    }

    const circles = history.map((h, i) => `
      <circle cx="${getX(i).toFixed(1)}" cy="${getY(h.weight).toFixed(1)}" r="4" fill="var(--bg-surface)" stroke="var(--accent-work)" stroke-width="2.5"/>
      <text x="${getX(i).toFixed(1)}" y="${getY(h.weight) - 6}" fill="var(--text-primary)" font-size="8.5" font-weight="800" text-anchor="middle">${h.weight}</text>
    `).join('');

    const firstDate = new Date(history[0].date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const lastDate = new Date(history[history.length - 1].date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

    return `
      <svg class="weight-svg-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" width="100%" height="${height}">
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-work)" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="var(--accent-work)" stop-opacity="0.01"/>
          </linearGradient>
        </defs>
        <!-- Lignes de repères -->
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left + plotWidth}" y2="${padding.top}" stroke="var(--border-subtle)" stroke-width="1"/>
        <line x1="${padding.left}" y1="${padding.top + plotHeight/2}" x2="${padding.left + plotWidth}" y2="${padding.top + plotHeight/2}" stroke="var(--border-subtle)" stroke-width="1"/>
        <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${padding.left + plotWidth}" y2="${padding.top + plotHeight}" stroke="var(--border-subtle)" stroke-width="1"/>

        <!-- Échelle Y -->
        <text x="${padding.left - 6}" y="${padding.top + 3}" fill="var(--text-muted)" font-size="8.5" text-anchor="end">${maxW}</text>
        <text x="${padding.left - 6}" y="${padding.top + plotHeight + 3}" fill="var(--text-muted)" font-size="8.5" text-anchor="end">${minW}</text>

        <!-- Ligne Objectif -->
        ${targetLine}

        <!-- Courbe & Zone -->
        <polygon points="${areaPoints}" fill="url(#weightGrad)"/>
        <polyline points="${points}" fill="none" stroke="var(--accent-work)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${circles}

        <!-- Dates X -->
        <text x="${padding.left}" y="${height - 4}" fill="var(--text-muted)" font-size="8.5">${firstDate}</text>
        <text x="${padding.left + plotWidth}" y="${height - 4}" fill="var(--text-muted)" font-size="8.5" text-anchor="end">${lastDate}</text>
      </svg>
    `;
  }
}

window.dashboardManager = new DashboardManager();
