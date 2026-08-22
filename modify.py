import sys
import os

filepath = r"c:\Users\mplp000\AndroidStudioProjects\WORK OUT\index.html"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">'
    ),
    (
        '  <link rel="icon" type="image/svg+xml" href="icons/icon.svg">',
        '  <link rel="icon" type="image/svg+xml" href="icons/icon.svg">\n\n  <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\';">\n\n  <!-- Prévention du flash de thème (FOUC) -->\n  <script>\n    document.documentElement.dataset.theme =\n      JSON.parse(localStorage.getItem(\'fb17_preferences\') || \'{}\').theme || \'dark\';\n  </script>'
    ),
    (
        '  <link rel="stylesheet" href="css/components.css">',
        '  <link rel="stylesheet" href="css/components.css">\n  <style>\n    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }\n  </style>'
    ),
    (
        '<button class="icon-btn" id="btn-quick-theme" onclick="toggleQuickTheme()" title="Changer de thème">',
        '<button class="icon-btn" id="btn-quick-theme" onclick="toggleQuickTheme()" title="Changer de thème" aria-label="Changer de thème">'
    ),
    (
        '<input type="time" id="setting-target-time" class="styled-input" value="17:00">',
        '<label for="setting-target-time" class="sr-only">Heure de rendez-vous</label>\n            <input type="time" id="setting-target-time" class="styled-input" value="17:00">'
    ),
    (
        '<select id="setting-rounds" class="styled-input">',
        '<label for="setting-rounds" class="sr-only">Nombre de séries</label>\n            <select id="setting-rounds" class="styled-input">'
    ),
    (
        '<select id="setting-plank-duration" class="styled-input">',
        '<label for="setting-plank-duration" class="sr-only">Durée de gainage</label>\n            <select id="setting-plank-duration" class="styled-input">'
    ),
    (
        '<input type="number" id="setting-work-duration" class="styled-input" style="width: 70px;" value="40" min="20" max="90">',
        '<label for="setting-work-duration" class="sr-only">Temps d\'effort</label>\n            <input type="number" id="setting-work-duration" class="styled-input" style="width: 70px;" value="40" min="20" max="90">'
    ),
    (
        '<input type="number" id="setting-rest-duration" class="styled-input" style="width: 70px;" value="20" min="10" max="60">',
        '<label for="setting-rest-duration" class="sr-only">Temps de récupération</label>\n            <input type="number" id="setting-rest-duration" class="styled-input" style="width: 70px;" value="20" min="10" max="60">'
    ),
    (
        '<select id="setting-theme" class="styled-input">\n              <option value="dark">Mode Sombre</option>\n              <option value="light">Mode Clair</option>\n            </select>',
        '<label for="setting-theme" class="sr-only">Thème visuel</label>\n            <select id="setting-theme" class="styled-input">\n              <option value="dark">Mode Sombre</option>\n              <option value="light">Mode Clair</option>\n              <option value="system">Automatique (Système)</option>\n            </select>'
    ),
    (
        '<button class="icon-btn" onclick="confirmQuitWorkout()" title="Quitter la séance">',
        '<button class="icon-btn" onclick="confirmQuitWorkout()" title="Quitter la séance" aria-label="Quitter la séance">'
    ),
    (
        '<button class="icon-btn" onclick="window.audioEngine.soundEnabled = !window.audioEngine.soundEnabled; this.classList.toggle(\'muted\', !window.audioEngine.soundEnabled);" title="Son">',
        '<button class="icon-btn" onclick="window.audioEngine.soundEnabled = !window.audioEngine.soundEnabled; this.classList.toggle(\'muted\', !window.audioEngine.soundEnabled);" title="Son" aria-label="Activer ou désactiver le son">'
    ),
    (
        '<button class="ctrl-btn" onclick="prevWorkoutExercise()" title="Exercice précédent">',
        '<button class="ctrl-btn" onclick="prevWorkoutExercise()" title="Exercice précédent" aria-label="Exercice précédent">'
    ),
    (
        '<button class="ctrl-btn ctrl-btn-primary" id="btn-live-pause" onclick="toggleWorkoutPause()" title="Pause / Reprendre">',
        '<button class="ctrl-btn ctrl-btn-primary" id="btn-live-pause" onclick="toggleWorkoutPause()" title="Pause / Reprendre" aria-label="Pause ou reprendre la séance">'
    ),
    (
        '<button class="ctrl-btn" onclick="skipWorkoutExercise()" title="Exercice suivant">',
        '<button class="ctrl-btn" onclick="skipWorkoutExercise()" title="Exercice suivant" aria-label="Exercice suivant">'
    ),
    (
        '<!-- Scripts Applicatifs -->\n  <script src="js/exercises.js"></script>\n  <script src="js/engine-3d.js"></script>\n  <script src="js/audio.js"></script>\n  <script src="js/storage.js"></script>\n  <script src="js/workout.js"></script>\n  <script src="js/dashboard.js"></script>\n  <script src="js/motivation.js"></script>\n  <script src="js/notifications.js"></script>\n  <script src="js/pwa.js"></script>\n  <script src="js/app.js"></script>',
        '<!-- Scripts Applicatifs (defer pour téléchargement parallèle) -->\n  <script src="js/exercises.js" defer></script>\n  <script src="js/engine-3d.js" defer></script>\n  <script src="js/audio.js" defer></script>\n  <script src="js/storage.js" defer></script>\n  <script src="js/workout.js" defer></script>\n  <script src="js/dashboard.js" defer></script>\n  <script src="js/motivation.js" defer></script>\n  <script src="js/notifications.js" defer></script>\n  <script src="js/pwa.js" defer></script>\n  <script src="js/app.js" defer></script>'
    )
]

for old, new in replacements:
    # Need to handle potential \r\n vs \n differences in multi-line strings
    old_crlf = old.replace(\'\n\', \'\r\n\')
    new_crlf = new.replace(\'\n\', \'\r\n\')
    if old in content:
        content = content.replace(old, new)
    elif old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
    else:
        print(f"Failed to find:\\n{old!r}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Modifications done.")
