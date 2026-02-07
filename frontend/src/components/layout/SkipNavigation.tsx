/**
 * Skip Navigation Component
 * 
 * Provides skip links for keyboard users to bypass repetitive navigation.
 * Validates: Requirements 20.2
 */

'use client';

import React from 'react';

export interface SkipLink {
  href: string;
  label: string;
}

export interface SkipNavigationProps {
  links?: SkipLink[];
}

const DEFAULT_SKIP_LINKS: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
];

/**
 * Skip navigation links component
 * Appears at the top of the page and becomes visible on keyboard focus
 */
export function SkipNavigation({ links = DEFAULT_SKIP_LINKS }: SkipNavigationProps) {
  const handleSkipClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Focus the target element
      targetElement.focus();
      
      // If element is not naturally focusable, make it focusable temporarily
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      // Scroll to element
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav 
      aria-label="Skip navigation links"
      className="skip-navigation"
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => handleSkipClick(e, link.href)}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
      
      <style jsx>{`
        .skip-navigation {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          background: transparent;
        }

        .skip-link {
          position: absolute;
          top: -100px;
          left: 0;
          padding: 0.75rem 1.5rem;
          background: #1e40af;
          color: white;
          text-decoration: none;
          font-weight: 600;
          border-radius: 0 0 0.375rem 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: top 0.2s ease-in-out;
          white-space: nowrap;
        }

        .skip-link:focus {
          top: 0;
          outline: 3px solid #fbbf24;
          outline-offset: 2px;
        }

        .skip-link:hover {
          background: #1e3a8a;
        }

        @media (prefers-color-scheme: dark) {
          .skip-link {
            background: #3b82f6;
          }

          .skip-link:hover {
            background: #2563eb;
          }
        }
      `}</style>
    </nav>
  );
}
