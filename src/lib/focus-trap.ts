/**
 * Focus trap utility for modal accessibility
 */

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
];

export class FocusTrap {
  private container: HTMLElement;
  private previouslyFocusedElement: Element | null = null;
  private focusableElements: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.previouslyFocusedElement = document.activeElement;
    this.updateFocusableElements();
  }

  private updateFocusableElements() {
    this.focusableElements = Array.from(
      this.container.querySelectorAll(FOCUSABLE_ELEMENTS.join(','))
    ).filter((el) => {
      const element = el as HTMLElement;
      return (
        element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element === document.activeElement
      );
    }) as HTMLElement[];
  }

  activate() {
    this.updateFocusableElements();
    
    // Focus first focusable element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('focusin', this.handleFocusIn);
  }

  deactivate() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('focusin', this.handleFocusIn);

    // Restore focus to previously focused element
    if (this.previouslyFocusedElement instanceof HTMLElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    this.updateFocusableElements();

    if (this.focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  private handleFocusIn = (event: Event) => {
    const target = event.target as HTMLElement;
    
    if (!this.container.contains(target)) {
      event.preventDefault();
      
      // Redirect focus back to container
      this.updateFocusableElements();
      if (this.focusableElements.length > 0) {
        this.focusableElements[0].focus();
      }
    }
  };
}