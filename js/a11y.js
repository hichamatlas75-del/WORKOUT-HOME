/**
 * FULL BODY 17 — ACCESSIBILITY (A11Y) ENHANCEMENT MODULE
 * ARIA labels, semantic HTML, keyboard navigation, and screen reader support
 * @module a11y
 */

/**
 * A11y Manager — Improves accessibility across the application
 * @class
 */
class A11yManager {
  constructor() {
    this.enabled = this.detectAccessibilityNeeds();
    this.announcer = this._createAnnouncer();
    this.focusTrap = null;
  }

  /**
   * Detect if accessibility features should be enabled
   * @private
   * @returns {boolean} True if accessibility is needed
   */
  detectAccessibilityNeeds() {
    // Check for user preference
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches === false ||
           localStorage.getItem('a11y_enabled') === 'true';
  }

  /**
   * Create screen reader announcer element
   * @private
   * @returns {HTMLElement} Announcer div
   */
  _createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(announcer);
    return announcer;
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {boolean} [polite=true] - Use polite (true) or assertive (false) priority
   */
  announce(message, polite = true) {
    this.announcer.setAttribute('aria-live', polite ? 'polite' : 'assertive');
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 3000);
  }

  /**
   * Add ARIA labels to interactive elements
   * @param {Element} element - DOM element
   * @param {string} label - Aria label text
   * @param {string} [role] - Optional ARIA role
   * @param {Object} [attrs] - Additional ARIA attributes
   */
  makeAccessible(element, label, role, attrs = {}) {
    element.setAttribute('aria-label', label);

    if (role) {
      element.setAttribute('role', role);
    }

    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(`aria-${key}`, value);
    });
  }

  /**
   * Make a button keyboard accessible
   * @param {HTMLElement} button - Button element
   * @param {Function} callback - Click handler
   * @param {string} [label] - Optional aria-label
   */
  makeKeyboardButton(button, callback, label) {
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');

    if (label) {
      button.setAttribute('aria-label', label);
    }

    button.addEventListener('click', callback);
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
      }
    });
  }

  /**
   * Enhance workout timer display for screen readers
   * @param {Element} timerElement - Timer display element
   * @param {number} seconds - Remaining seconds
   * @param {string} state - Current state (WORK, REST, etc.)
   */
  announceWorkoutState(timerElement, seconds, state) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const timeStr = `${minutes}:${secs.toString().padStart(2, '0')}`;

    timerElement.setAttribute('aria-live', 'assertive');
    timerElement.setAttribute('aria-label', `${state} phase, ${timeStr} remaining`);

    // Announce every 10 seconds for long phases
    if (seconds % 10 === 0) {
      this.announce(`${state}: ${timeStr}`, false);
    }
  }

  /**
   * Enhance exercise card accessibility
   * @param {Element} exerciseCard - Exercise element
   * @param {Object} exerciseData - Exercise info
   */
  enhanceExerciseCard(exerciseCard, exerciseData) {
    const heading = exerciseCard.querySelector('h2, h3, .exercise-name');
    if (heading) {
      heading.setAttribute('role', 'heading');
      heading.setAttribute('aria-level', '2');
    }

    const video = exerciseCard.querySelector('video');
    if (video) {
      video.setAttribute('aria-label', `Video demonstration of ${exerciseData.name}`);
    }

    const description = exerciseCard.querySelector('.exercise-description, .exercise-cue');
    if (description) {
      description.setAttribute('role', 'doc-subtitle');
    }

    // Add button roles for interactive elements
    const buttons = exerciseCard.querySelectorAll('[role="button"], button');
    buttons.forEach(btn => {
      if (!btn.getAttribute('aria-label')) {
        btn.setAttribute('aria-label', btn.textContent || 'Action button');
      }
    });
  }

  /**
   * Create accessible progress indicator
   * @param {Element} container - Container for progress element
   * @param {number} current - Current value
   * @param {number} total - Total value
   * @param {string} [label='Progress'] - Label text
   */
  createProgressIndicator(container, current, total, label = 'Progress') {
    const progress = document.createElement('progress');
    progress.max = total;
    progress.value = current;
    progress.setAttribute('aria-label', label);
    progress.setAttribute('aria-valuenow', current);
    progress.setAttribute('aria-valuemin', '0');
    progress.setAttribute('aria-valuemax', total);

    container.appendChild(progress);
    return progress;
  }

  /**
   * Enable keyboard navigation for tab menu
   * @param {Element} tabContainer - Tab container element
   */
  enableKeyboardTabNavigation(tabContainer) {
    const tabs = tabContainer.querySelectorAll('[role="tab"]');
    let currentIndex = 0;

    tabs.forEach((tab, index) => {
      tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      tab.addEventListener('keydown', (e) => {
        let newIndex = currentIndex;

        if (e.key === 'ArrowRight') {
          newIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft') {
          newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
          newIndex = 0;
        } else if (e.key === 'End') {
          newIndex = tabs.length - 1;
        } else {
          return;
        }

        e.preventDefault();
        tabs[currentIndex].setAttribute('tabindex', '-1');
        tabs[newIndex].setAttribute('tabindex', '0');
        tabs[newIndex].focus();
        currentIndex = newIndex;

        // Trigger tab click
        tabs[newIndex].click();
      });
    });
  }

  /**
   * Make a modal dialog accessible (ARIA Authoring Practices)
   * @param {Element} modal - Modal dialog element
   * @param {Element} trigger - Trigger element that opened modal
   */
  enhanceModal(modal, trigger) {
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const closeButton = modal.querySelector('[data-close], .close-btn, .modal-close');
    if (closeButton) {
      closeButton.setAttribute('aria-label', 'Close dialog');
      this.makeAccessible(closeButton, 'Close dialog', 'button');
    }

    // Focus management
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Trap focus within modal
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }

        if (e.key === 'Escape') {
          modal.close?.() || modal.remove?.();
          trigger?.focus();
        }
      });

      // Auto-focus first focusable element
      setTimeout(() => firstElement.focus(), 100);
    }
  }

  /**
   * Add text alternative to icon-only buttons
   * @param {Element} button - Button with icon only
   * @param {string} label - Text label for screen readers
   */
  enhanceIconButton(button, label) {
    button.setAttribute('aria-label', label);

    // Add visible text if preference-based
    if (localStorage.getItem('a11y_show_labels') === 'true') {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'icon-label';
      labelSpan.textContent = label;
      labelSpan.style.marginLeft = '0.5em';
      button.appendChild(labelSpan);
    }
  }

  /**
   * Enhance form inputs with labels and error messages
   * @param {HTMLElement} input - Input element
   * @param {string} labelText - Label text
   * @param {string} [errorId] - ID for error message element
   */
  enhanceFormInput(input, labelText, errorId) {
    input.setAttribute('aria-label', labelText);

    if (errorId) {
      input.setAttribute('aria-describedby', errorId);
    }

    // Create visual label if not present
    const existingLabel = input.previousElementSibling?.tagName === 'LABEL';
    if (!existingLabel) {
      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = labelText;
      label.className = 'form-label';
      input.parentElement?.insertBefore(label, input);
    }
  }

  /**
   * Enable skip to main content link
   */
  enableSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      background: #000;
      color: #fff;
      padding: 8px;
      z-index: 100;
      text-decoration: none;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Check for common accessibility issues
   * @returns {Object} Accessibility audit results
   */
  audit() {
    const results = {
      missingAltText: [],
      missingLabels: [],
      lowContrast: [],
      focusable: true
    };

    // Check images
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        results.missingAltText.push(img);
      }
    });

    // Check form inputs
    document.querySelectorAll('input, textarea, select').forEach(input => {
      const hasLabel = document.querySelector(`label[for="${input.id}"]`) ||
                       input.getAttribute('aria-label') ||
                       input.title;
      if (!hasLabel) {
        results.missingLabels.push(input);
      }
    });

    // Check focusability
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    results.focusable = focusableElements.length > 0;

    return results;
  }

  /**
   * Log accessibility audit results
   */
  logAudit() {
    const audit = this.audit();
    console.group('🎯 Accessibility Audit');
    console.log('Missing alt text:', audit.missingAltText.length);
    console.log('Missing labels:', audit.missingLabels.length);
    console.log('Focusable elements present:', audit.focusable);
    console.groupEnd();
  }
}

// Global instance
window.a11y = new A11yManager();

// Enable on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.a11y.enableSkipLink();
  if (localStorage.getItem('a11y_debug') === 'true') {
    window.a11y.logAudit();
  }
});
