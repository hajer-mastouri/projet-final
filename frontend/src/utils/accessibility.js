// Accessibility utilities for the BookRecs app

/**
 * Manages focus for keyboard navigation
 */
export class FocusManager {
  constructor() {
    this.focusableElements = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableElements))
      .filter(el => this.isVisible(el));
  }

  /**
   * Check if element is visible
   */
  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  /**
   * Trap focus within a container (for modals)
   */
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Restore focus to previously focused element
   */
  restoreFocus(element) {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }
}

/**
 * Announces messages to screen readers
 */
export class ScreenReaderAnnouncer {
  constructor() {
    this.liveRegion = this.createLiveRegion();
  }

  createLiveRegion() {
    const region = document.createElement('div');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.id = 'sr-announcer';
    document.body.appendChild(region);
    return region;
  }

  /**
   * Announce a message to screen readers
   */
  announce(message, priority = 'polite') {
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Announce urgent messages
   */
  announceUrgent(message) {
    this.announce(message, 'assertive');
  }
}

/**
 * Keyboard navigation utilities
 */
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation for lists
   */
  static handleArrowNavigation(event, items, currentIndex) {
    const { key } = event;
    let newIndex = currentIndex;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        newIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;
      default:
        return currentIndex;
    }

    if (items[newIndex]) {
      items[newIndex].focus();
    }

    return newIndex;
  }

  /**
   * Handle escape key for closing modals/dropdowns
   */
  static handleEscapeKey(event, closeCallback) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCallback();
    }
  }
}

/**
 * Color contrast utilities
 */
export class ColorContrast {
  /**
   * Calculate relative luminance
   */
  static getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(...color1);
    const lum2 = this.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  static meetsWCAG(color1, color2, level = 'AA', size = 'normal') {
    const ratio = this.getContrastRatio(color1, color2);
    const threshold = level === 'AAA' 
      ? (size === 'large' ? 4.5 : 7) 
      : (size === 'large' ? 3 : 4.5);
    return ratio >= threshold;
  }
}

/**
 * Form accessibility utilities
 */
export class FormAccessibility {
  /**
   * Associate label with form control
   */
  static associateLabel(labelElement, inputElement) {
    const id = inputElement.id || `input-${Date.now()}`;
    inputElement.id = id;
    labelElement.setAttribute('for', id);
  }

  /**
   * Add error message to form control
   */
  static addErrorMessage(inputElement, message) {
    const errorId = `${inputElement.id}-error`;
    let errorElement = document.getElementById(errorId);
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = errorId;
      errorElement.className = 'form-error';
      errorElement.setAttribute('role', 'alert');
      inputElement.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    inputElement.setAttribute('aria-describedby', errorId);
    inputElement.setAttribute('aria-invalid', 'true');
  }

  /**
   * Remove error message from form control
   */
  static removeErrorMessage(inputElement) {
    const errorId = `${inputElement.id}-error`;
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
      errorElement.remove();
    }
    
    inputElement.removeAttribute('aria-describedby');
    inputElement.removeAttribute('aria-invalid');
  }
}

/**
 * Loading state accessibility
 */
export class LoadingAccessibility {
  /**
   * Create accessible loading indicator
   */
  static createLoadingIndicator(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.className = 'loading-spinner';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', message);
    
    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = message;
    loader.appendChild(srText);
    
    return loader;
  }

  /**
   * Update loading message
   */
  static updateLoadingMessage(loader, message) {
    loader.setAttribute('aria-label', message);
    const srText = loader.querySelector('.sr-only');
    if (srText) {
      srText.textContent = message;
    }
  }
}

/**
 * Modal accessibility utilities
 */
export class ModalAccessibility {
  constructor() {
    this.focusManager = new FocusManager();
    this.previousFocus = null;
  }

  /**
   * Open modal with proper accessibility
   */
  openModal(modalElement) {
    // Store current focus
    this.previousFocus = document.activeElement;
    
    // Set modal attributes
    modalElement.setAttribute('role', 'dialog');
    modalElement.setAttribute('aria-modal', 'true');
    
    // Trap focus
    this.cleanupFocus = this.focusManager.trapFocus(modalElement);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Handle escape key
    this.handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closeModal(modalElement);
      }
    };
    document.addEventListener('keydown', this.handleEscape);
  }

  /**
   * Close modal and restore accessibility
   */
  closeModal(modalElement) {
    // Restore focus
    if (this.previousFocus) {
      this.focusManager.restoreFocus(this.previousFocus);
    }
    
    // Cleanup focus trap
    if (this.cleanupFocus) {
      this.cleanupFocus();
    }
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Remove escape handler
    document.removeEventListener('keydown', this.handleEscape);
    
    // Remove modal attributes
    modalElement.removeAttribute('role');
    modalElement.removeAttribute('aria-modal');
  }
}

// Create global instances
export const focusManager = new FocusManager();
export const announcer = new ScreenReaderAnnouncer();
export const modalAccessibility = new ModalAccessibility();

// Utility functions
export const a11y = {
  focus: focusManager,
  announce: announcer.announce.bind(announcer),
  announceUrgent: announcer.announceUrgent.bind(announcer),
  keyboard: KeyboardNavigation,
  contrast: ColorContrast,
  form: FormAccessibility,
  loading: LoadingAccessibility,
  modal: modalAccessibility
};
