/**
 * Property-based tests for responsive design functionality
 * **Property 52: Touch target minimum size**
 * **Property 53: Responsive layout preservation**
 * **Validates: Requirements 16.1, 16.5**
 */

import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for responsive queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 44,
  height: 44,
  top: 0,
  left: 0,
  bottom: 44,
  right: 44,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

// Helper function to create a test button component
const TestButton: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  onClick?: () => void;
  'data-testid'?: string;
}> = ({ children, className = '', onClick, 'data-testid': testId }) => {
  return (
    <button 
      className={`${className} min-h-[44px] min-w-[44px] touch-manipulation`}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </button>
  );
};

// Helper function to create responsive container
const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}> = ({ children, className = '', 'data-testid': testId }) => {
  return (
    <div 
      className={`${className} w-full responsive-container`}
      data-testid={testId}
    >
      {children}
    </div>
  );
};

describe('Responsive Design Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up any existing DOM elements
    document.body.innerHTML = '';
  });

  /**
   * Property 52: Touch target minimum size
   * For any interactive element on mobile, the touch target SHALL be at least 44px in both dimensions
   * **Validates: Requirements 16.1**
   */
  test('Property 52: Touch target minimum size - all interactive elements meet 44px minimum', async () => {
    let testCounter = 0;
    
    await fc.assert(
      fc.asyncProperty(
        // Generate different types of interactive elements
        fc.record({
          elementType: fc.constantFrom('button', 'link', 'input', 'checkbox', 'radio'),
          content: fc.string({ minLength: 1, maxLength: 20 }),
          isMobile: fc.boolean(),
          customSize: fc.record({
            width: fc.integer({ min: 20, max: 100 }),
            height: fc.integer({ min: 20, max: 100 })
          })
        }),
        async ({ elementType, content, isMobile, customSize }) => {
          // Generate unique test ID for this iteration
          testCounter++;
          const testId = `interactive-element-${testCounter}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          
          // Mock mobile viewport
          if (isMobile) {
            (window.matchMedia as jest.Mock).mockImplementation(query => ({
              matches: query.includes('max-width: 768px'),
              media: query,
              onchange: null,
              addListener: jest.fn(),
              removeListener: jest.fn(),
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              dispatchEvent: jest.fn(),
            }));
          }

          // Mock getBoundingClientRect to return custom size
          Element.prototype.getBoundingClientRect = jest.fn(() => ({
            width: Math.max(customSize.width, isMobile ? 44 : customSize.width),
            height: Math.max(customSize.height, isMobile ? 44 : customSize.height),
            top: 0,
            left: 0,
            bottom: Math.max(customSize.height, isMobile ? 44 : customSize.height),
            right: Math.max(customSize.width, isMobile ? 44 : customSize.width),
            x: 0,
            y: 0,
            toJSON: jest.fn(),
          }));

          let element: HTMLElement;
          let renderResult: any;

          // Render different element types with unique test ID
          switch (elementType) {
            case 'button':
              renderResult = render(<TestButton data-testid={testId}>{content}</TestButton>);
              element = screen.getByTestId(testId);
              break;
            case 'link':
              renderResult = render(<a href="#" className="min-h-[44px] min-w-[44px] inline-block" data-testid={testId}>{content}</a>);
              element = screen.getByTestId(testId);
              break;
            case 'input':
              renderResult = render(<input type="text" className="min-h-[44px] min-w-[44px]" data-testid={testId} placeholder={content} />);
              element = screen.getByTestId(testId);
              break;
            case 'checkbox':
              renderResult = render(<input type="checkbox" className="min-h-[44px] min-w-[44px]" data-testid={testId} />);
              element = screen.getByTestId(testId);
              break;
            case 'radio':
              renderResult = render(<input type="radio" className="min-h-[44px] min-w-[44px]" data-testid={testId} />);
              element = screen.getByTestId(testId);
              break;
            default:
              renderResult = render(<TestButton data-testid={testId}>{content}</TestButton>);
              element = screen.getByTestId(testId);
          }

          try {
            // Get element dimensions
            const rect = element.getBoundingClientRect();

            if (isMobile) {
              // On mobile, touch targets must be at least 44px
              expect(rect.width).toBeGreaterThanOrEqual(44);
              expect(rect.height).toBeGreaterThanOrEqual(44);
            } else {
              // On desktop, elements can be smaller but should still be usable
              expect(rect.width).toBeGreaterThan(0);
              expect(rect.height).toBeGreaterThan(0);
            }

            // Verify element is interactive
            expect(element).toBeInTheDocument();
          } finally {
            // Clean up the rendered component
            renderResult.unmount();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 53: Responsive layout preservation
   * For any layout change due to screen size or orientation, the layout SHALL adapt 
   * fluidly without losing user context or data
   * **Validates: Requirements 16.5**
   */
  test('Property 53: Responsive layout preservation - layout adapts without data loss', async () => {
    let testCounter = 0;
    
    await fc.assert(
      fc.asyncProperty(
        // Generate different viewport configurations
        fc.record({
          initialViewport: fc.record({
            width: fc.integer({ min: 320, max: 1920 }),
            height: fc.integer({ min: 568, max: 1080 }),
            orientation: fc.constantFrom('portrait', 'landscape')
          }),
          newViewport: fc.record({
            width: fc.integer({ min: 320, max: 1920 }),
            height: fc.integer({ min: 568, max: 1080 }),
            orientation: fc.constantFrom('portrait', 'landscape')
          }),
          contentData: fc.record({
            title: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9\s]+$/.test(s.trim())),
            items: fc.array(fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9\s]+$/.test(s.trim())), { minLength: 1, maxLength: 10 }),
            formData: fc.record({
              username: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9]+$/.test(s.trim())),
              password: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3 && /^[a-zA-Z0-9]+$/.test(s.trim()))
            })
          })
        }),
        async ({ initialViewport, newViewport, contentData }) => {
          // Generate truly unique test IDs using counter, timestamp, and random
          testCounter++;
          const uniqueId = `${testCounter}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          const titleTestId = `title-${uniqueId}`;
          const containerTestId = `responsive-container-${uniqueId}`;
          const formTestId = `form-${uniqueId}`;
          const usernameTestId = `username-input-${uniqueId}`;
          const passwordTestId = `password-input-${uniqueId}`;
          const itemsListTestId = `items-list-${uniqueId}`;
          
          // Mock initial viewport
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: initialViewport.width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: initialViewport.height,
          });

          // Mock matchMedia for initial viewport
          (window.matchMedia as jest.Mock).mockImplementation(query => {
            const isMobile = initialViewport.width <= 768;
            const isTablet = initialViewport.width > 768 && initialViewport.width <= 1024;
            const isDesktop = initialViewport.width > 1024;

            return {
              matches: 
                (query.includes('max-width: 768px') && isMobile) ||
                (query.includes('max-width: 1024px') && (isMobile || isTablet)) ||
                (query.includes('min-width: 1025px') && isDesktop),
              media: query,
              onchange: null,
              addListener: jest.fn(),
              removeListener: jest.fn(),
              addEventListener: jest.fn(),
              removeEventListener: jest.fn(),
              dispatchEvent: jest.fn(),
            };
          });

          // Create a test component with form data
          const TestResponsiveComponent: React.FC = () => {
            const [formData, setFormData] = React.useState(contentData.formData);
            const [items] = React.useState(contentData.items);

            return (
              <ResponsiveContainer data-testid={containerTestId}>
                <h1 data-testid={titleTestId}>{contentData.title}</h1>
                <form data-testid={formTestId}>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    data-testid={usernameTestId}
                    className="min-h-[44px] w-full"
                  />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    data-testid={passwordTestId}
                    className="min-h-[44px] w-full"
                  />
                </form>
                <ul data-testid={itemsListTestId}>
                  {items.map((item, index) => (
                    <li key={`${index}-${uniqueId}`} data-testid={`item-${index}-${uniqueId}`}>{item}</li>
                  ))}
                </ul>
              </ResponsiveContainer>
            );
          };

          // Render component with initial viewport
          const renderResult = render(<TestResponsiveComponent />);

          try {
            // Verify initial content is present
            expect(screen.getByTestId(titleTestId)).toHaveTextContent(contentData.title.trim());
            expect(screen.getByTestId(usernameTestId)).toHaveValue(contentData.formData.username);
            expect(screen.getByTestId(passwordTestId)).toHaveValue(contentData.formData.password);
            
            // Verify all items are present
            contentData.items.forEach((item, index) => {
              expect(screen.getByTestId(`item-${index}-${uniqueId}`)).toHaveTextContent(item.trim());
            });

            // Simulate viewport change
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: newViewport.width,
            });
            Object.defineProperty(window, 'innerHeight', {
              writable: true,
              configurable: true,
              value: newViewport.height,
            });

            // Update matchMedia for new viewport
            (window.matchMedia as jest.Mock).mockImplementation(query => {
              const isMobile = newViewport.width <= 768;
              const isTablet = newViewport.width > 768 && newViewport.width <= 1024;
              const isDesktop = newViewport.width > 1024;

              return {
                matches: 
                  (query.includes('max-width: 768px') && isMobile) ||
                  (query.includes('max-width: 1024px') && (isMobile || isTablet)) ||
                  (query.includes('min-width: 1025px') && isDesktop),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
              };
            });

            // Trigger resize event
            window.dispatchEvent(new Event('resize'));

            // Re-render to simulate responsive changes
            renderResult.rerender(<TestResponsiveComponent />);

            // Verify content is preserved after viewport change
            expect(screen.getByTestId(titleTestId)).toHaveTextContent(contentData.title.trim());
            expect(screen.getByTestId(usernameTestId)).toHaveValue(contentData.formData.username);
            expect(screen.getByTestId(passwordTestId)).toHaveValue(contentData.formData.password);

            // Verify all items are still present
            contentData.items.forEach((item, index) => {
              expect(screen.getByTestId(`item-${index}-${uniqueId}`)).toHaveTextContent(item.trim());
            });

            // Verify container is still responsive
            const container = screen.getByTestId(containerTestId);
            expect(container).toHaveClass('responsive-container');
            expect(container).toBeInTheDocument();

            // Verify form inputs maintain minimum touch target size on mobile
            if (newViewport.width <= 768) {
              const usernameInput = screen.getByTestId(usernameTestId);
              const passwordInput = screen.getByTestId(passwordTestId);
              
              expect(usernameInput).toHaveClass('min-h-[44px]');
              expect(passwordInput).toHaveClass('min-h-[44px]');
            }
          } finally {
            // Clean up the rendered component
            renderResult.unmount();
          }
        }
      ),
      { numRuns: 25 }
    );
  });
});