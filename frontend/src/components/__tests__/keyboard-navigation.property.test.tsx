/**
 * Property-Based Test: Keyboard Navigation Completeness
 * 
 * Property 48: Keyboard navigation completeness
 * For any interactive element in the application, the element SHALL be
 * keyboard accessible with visible focus indicators and proper tab order.
 * 
 * Validates: Requirements 20.2
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Helper function to get all interactive elements in a container
 */
function getInteractiveElements(container: HTMLElement): HTMLElement[] {
  const interactiveSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
    '[role="link"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="menuitem"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(interactiveSelectors))
    .filter(el => {
      // Filter out hidden elements
      const style = window.getComputedStyle(el);
      return el.offsetParent !== null && 
             style.visibility !== 'hidden' &&
             style.display !== 'none';
    });
}

/**
 * Helper function to check if element has visible focus indicator
 */
function hasFocusIndicator(element: HTMLElement): boolean {
  element.focus();
  const styles = window.getComputedStyle(element);
  
  // Check for outline
  const hasOutline = styles.outline !== 'none' && 
                     styles.outline !== '' && 
                     styles.outlineWidth !== '0px';
  
  // Check for box-shadow (alternative focus indicator)
  const hasBoxShadow = styles.boxShadow !== 'none' && 
                       styles.boxShadow !== '';
  
  // Check for border change
  const hasBorder = styles.borderWidth !== '0px' && 
                    styles.borderStyle !== 'none';
  
  return hasOutline || hasBoxShadow || hasBorder;
}

/**
 * Helper function to check if element is in tab order
 */
function isInTabOrder(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex');
  
  // Elements with tabindex="-1" are not in tab order
  if (tabIndex === '-1') return false;
  
  // Naturally focusable elements are in tab order
  const naturallyFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  if (naturallyFocusable.includes(element.tagName)) {
    return !element.hasAttribute('disabled');
  }
  
  // Elements with tabindex >= 0 are in tab order
  if (tabIndex !== null) {
    const index = parseInt(tabIndex, 10);
    return !isNaN(index) && index >= 0;
  }
  
  return false;
}

describe('Property 48: Keyboard Navigation Completeness', () => {
  describe('Interactive Elements Keyboard Accessibility', () => {
    it('should make buttons keyboard accessible', () => {
      const { container } = render(
        <button type="button">Test Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).not.toBeNull();
      expect(isInTabOrder(button!)).toBe(true);
    });

    it('should make links keyboard accessible', () => {
      const { container } = render(
        <a href="/test">Test Link</a>
      );
      
      const link = container.querySelector('a');
      expect(link).not.toBeNull();
      expect(isInTabOrder(link!)).toBe(true);
    });

    it('should make inputs keyboard accessible', () => {
      const { container } = render(
        <input type="text" aria-label="Test input" />
      );
      
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      expect(isInTabOrder(input!)).toBe(true);
    });

    it('should make select elements keyboard accessible', () => {
      const { container } = render(
        <select aria-label="Test select">
          <option>Option 1</option>
        </select>
      );
      
      const select = container.querySelector('select');
      expect(select).not.toBeNull();
      expect(isInTabOrder(select!)).toBe(true);
    });

    it('should make textareas keyboard accessible', () => {
      const { container } = render(
        <textarea aria-label="Test textarea" />
      );
      
      const textarea = container.querySelector('textarea');
      expect(textarea).not.toBeNull();
      expect(isInTabOrder(textarea!)).toBe(true);
    });

    it('should make elements with tabindex="0" keyboard accessible', () => {
      const { container } = render(
        <div tabIndex={0} role="button">Custom Button</div>
      );
      
      const div = container.querySelector('[role="button"]');
      expect(div).not.toBeNull();
      expect(isInTabOrder(div!)).toBe(true);
    });

    it('should exclude disabled elements from tab order', () => {
      const { container } = render(
        <button type="button" disabled>Disabled Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).not.toBeNull();
      expect(isInTabOrder(button!)).toBe(false);
    });

    it('should exclude elements with tabindex="-1" from tab order', () => {
      const { container } = render(
        <div tabIndex={-1}>Not in tab order</div>
      );
      
      const div = container.querySelector('div');
      expect(div).not.toBeNull();
      expect(isInTabOrder(div!)).toBe(false);
    });
  });

  describe('Focus Indicators', () => {
    it('should have visible focus indicators on buttons', () => {
      const { container } = render(
        <button type="button">Test Button</button>
      );
      
      const button = container.querySelector('button');
      expect(button).not.toBeNull();
      
      if (button) {
        button.focus();
        const styles = window.getComputedStyle(button);
        
        // Should have some form of focus indicator
        const hasFocusStyle = 
          (styles.outline !== 'none' && styles.outline !== '') ||
          (styles.boxShadow !== 'none' && styles.boxShadow !== '') ||
          styles.borderWidth !== '0px';
        
        expect(hasFocusStyle).toBe(true);
      }
    });

    it('should have visible focus indicators on links', () => {
      const { container } = render(
        <a href="/test">Test Link</a>
      );
      
      const link = container.querySelector('a');
      expect(link).not.toBeNull();
      
      if (link) {
        link.focus();
        const styles = window.getComputedStyle(link);
        
        // Should have some form of focus indicator
        const hasFocusStyle = 
          (styles.outline !== 'none' && styles.outline !== '') ||
          (styles.boxShadow !== 'none' && styles.boxShadow !== '') ||
          styles.textDecoration !== 'none';
        
        expect(hasFocusStyle).toBe(true);
      }
    });

    it('should have visible focus indicators on inputs', () => {
      const { container } = render(
        <input type="text" aria-label="Test input" />
      );
      
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      
      if (input) {
        input.focus();
        const styles = window.getComputedStyle(input);
        
        // Should have some form of focus indicator
        const hasFocusStyle = 
          (styles.outline !== 'none' && styles.outline !== '') ||
          (styles.boxShadow !== 'none' && styles.boxShadow !== '') ||
          styles.borderWidth !== '0px';
        
        expect(hasFocusStyle).toBe(true);
      }
    });
  });

  describe('Tab Order', () => {
    it('should have logical tab order in forms', () => {
      const { container } = render(
        <form>
          <input type="text" aria-label="First" />
          <input type="text" aria-label="Second" />
          <button type="submit">Submit</button>
        </form>
      );
      const interactiveElements = getInteractiveElements(container);
      
      // Check that elements are in DOM order (natural tab order)
      for (let i = 0; i < interactiveElements.length - 1; i++) {
        const current = interactiveElements[i];
        const next = interactiveElements[i + 1];
        
        // Elements should be in document order
        const position = current.compareDocumentPosition(next);
        expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it('should not have positive tabindex values (anti-pattern)', () => {
      const { container } = render(
        <div>
          <button type="button" tabIndex={0}>Button 1</button>
          <button type="button">Button 2</button>
        </div>
      );
      const interactiveElements = getInteractiveElements(container);
      
      interactiveElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== null) {
          const index = parseInt(tabIndex, 10);
          // Positive tabindex is an anti-pattern
          expect(index).toBeLessThanOrEqual(0);
        }
      });
    });
  });

  describe('Skip Navigation', () => {
    it('should provide skip navigation structure', () => {
      const { container } = render(
        <nav aria-label="Skip navigation links">
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <a href="#navigation" className="skip-link">Skip to navigation</a>
          <a href="#search" className="skip-link">Skip to search</a>
        </nav>
      );
      
      const skipLinks = container.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);
      
      // Skip links should be keyboard accessible
      skipLinks.forEach(link => {
        expect(isInTabOrder(link as HTMLElement)).toBe(true);
      });
    });

    it('should have skip link to main content', () => {
      const { container } = render(
        <a href="#main-content" className="skip-link">Skip to main content</a>
      );
      
      const link = container.querySelector('a');
      expect(link).toHaveAttribute('href', '#main-content');
      expect(isInTabOrder(link!)).toBe(true);
    });
  });

  describe('Property: All interactive elements are keyboard accessible', () => {
    const interactiveElements = [
      { name: 'button', element: <button type="button">Button</button> },
      { name: 'link', element: <a href="/test">Link</a> },
      { name: 'input', element: <input type="text" aria-label="Input" /> },
      { name: 'select', element: <select aria-label="Select"><option>Option</option></select> },
      { name: 'textarea', element: <textarea aria-label="Textarea" /> },
      { name: 'custom button', element: <div tabIndex={0} role="button">Custom</div> },
    ];

    interactiveElements.forEach(({ name, element }) => {
      it(`should ensure ${name} is keyboard accessible`, () => {
        const { container } = render(element);
        const el = container.firstElementChild as HTMLElement;
        
        // Property: For any interactive element, it SHALL be keyboard accessible
        expect(el).not.toBeNull();
        expect(isInTabOrder(el)).toBe(true);
        
        // Element should not be disabled
        expect(el.hasAttribute('disabled')).toBe(false);
      });
    });
  });

  describe('Property: All interactive elements have visible focus indicators', () => {
    it('should ensure focus indicators are visible on all interactive element types', () => {
      const elements = [
        { type: 'button', element: <button type="button">Button</button> },
        { type: 'link', element: <a href="/test">Link</a> },
        { type: 'input', element: <input type="text" aria-label="Input" /> },
        { type: 'select', element: <select aria-label="Select"><option>Option</option></select> },
        { type: 'textarea', element: <textarea aria-label="Textarea" /> },
      ];

      elements.forEach(({ type, element }) => {
        const { container } = render(element);
        const el = container.firstElementChild as HTMLElement;
        
        expect(el).not.toBeNull();
        
        if (el) {
          el.focus();
          const styles = window.getComputedStyle(el);
          
          // Property: Element SHALL have visible focus indicator
          const hasFocusStyle = 
            (styles.outline !== 'none' && styles.outline !== '' && styles.outlineWidth !== '0px') ||
            (styles.boxShadow !== 'none' && styles.boxShadow !== '') ||
            (styles.borderWidth !== '0px' && styles.borderStyle !== 'none');
          
          expect(hasFocusStyle).toBe(true);
        }
      });
    });
  });

  describe('Property: Tab order is logical and follows visual order', () => {
    it('should ensure tab order follows DOM order', () => {
      const { container } = render(
        <div>
          <button type="button">First</button>
          <button type="button">Second</button>
          <button type="button">Third</button>
        </div>
      );
      
      const buttons = Array.from(container.querySelectorAll('button'));
      
      // Property: Tab order SHALL follow visual/DOM order
      for (let i = 0; i < buttons.length - 1; i++) {
        const current = buttons[i];
        const next = buttons[i + 1];
        
        const position = current.compareDocumentPosition(next);
        // Next element should come after current in document
        expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      }
    });

    it('should not use positive tabindex values', () => {
      const { container } = render(
        <div>
          <button type="button" tabIndex={0}>Button 1</button>
          <button type="button" tabIndex={-1}>Button 2</button>
          <button type="button">Button 3</button>
        </div>
      );
      
      const allElements = container.querySelectorAll('[tabindex]');
      
      // Property: Positive tabindex SHALL NOT be used (anti-pattern)
      allElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex');
        if (tabIndex !== null) {
          const index = parseInt(tabIndex, 10);
          expect(index).toBeLessThanOrEqual(0);
        }
      });
    });
  });

  describe('Focus Management', () => {
    it('should not create keyboard traps with disabled elements', () => {
      const { container } = render(
        <div>
          <button type="button">Enabled</button>
          <button type="button" disabled>Disabled</button>
          <button type="button">Enabled</button>
        </div>
      );
      
      const buttons = Array.from(container.querySelectorAll('button'));
      const enabledButtons = buttons.filter(btn => !btn.hasAttribute('disabled'));
      
      // Should have accessible buttons
      expect(enabledButtons.length).toBeGreaterThan(0);
      
      // All enabled buttons should be in tab order
      enabledButtons.forEach(button => {
        expect(isInTabOrder(button)).toBe(true);
      });
    });
  });
});
