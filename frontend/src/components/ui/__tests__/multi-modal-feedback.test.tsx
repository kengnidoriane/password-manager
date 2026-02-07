/**
 * Multi-Modal Feedback Integration Tests
 * Tests that components provide feedback through multiple channels
 * Requirements: 20.4 - Multi-modal feedback
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusIndicator, LoadingSpinner, StatusBadge } from '../StatusIndicator';
import { ActionButton, ProgressIndicator } from '../ActionFeedback';
import { screenReaderService } from '@/services/screenReaderService';

describe('Multi-Modal Feedback', () => {
  beforeEach(() => {
    screenReaderService.clearHistory();
  });

  describe('StatusIndicator', () => {
    it('provides visual feedback with icon and color', () => {
      render(<StatusIndicator status="success" message="Operation successful" />);
      
      // Visual: Icon is present
      const icon = screen.getByTitle('Success');
      expect(icon).toBeInTheDocument();
      
      // Visual: Message is displayed
      expect(screen.getByText('Operation successful')).toBeInTheDocument();
    });

    it('provides textual feedback with status type', () => {
      render(<StatusIndicator status="error" message="Operation failed" />);
      
      // Text: Status type is announced to screen readers
      expect(screen.getByText(/Error:/)).toHaveClass('sr-only');
      
      // Text: Message is visible
      expect(screen.getByText('Operation failed')).toBeInTheDocument();
    });

    it('provides ARIA live region for dynamic updates', () => {
      const { container } = render(<StatusIndicator status="loading" message="Processing" />);
      
      const statusElement = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveAttribute('aria-atomic', 'true');
    });

    it('hides decorative icons from screen readers', () => {
      render(<StatusIndicator status="success" message="Done" />);
      
      const icon = screen.getByTitle('Success');
      // The SVG itself has aria-hidden
      expect(icon.closest('svg')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('LoadingSpinner', () => {
    it('provides visual loading animation', () => {
      render(<LoadingSpinner message="Loading data" />);
      
      // Visual: Animated spinner icon
      const spinner = screen.getByTitle('Loading');
      expect(spinner.closest('svg')).toHaveClass('animate-spin');
    });

    it('provides textual loading message', () => {
      render(<LoadingSpinner message="Loading data" />);
      
      expect(screen.getByText('Loading data')).toBeInTheDocument();
    });

    it('announces loading state to screen readers', () => {
      const { container } = render(<LoadingSpinner message="Loading data" />);
      
      const statusElement = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe('StatusBadge', () => {
    it('combines color and text for status', () => {
      const { container } = render(<StatusBadge status="warning" label="Pending" />);
      
      // Visual: Badge has warning colors
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveClass('bg-yellow-100');
      
      // Text: Label is visible
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('provides accessible label with status type', () => {
      const { container } = render(<StatusBadge status="error" label="Failed" />);
      
      const badge = container.querySelector('[role="status"]');
      expect(badge).toHaveAttribute('aria-label', 'error: Failed');
    });

    it('includes hidden status type for screen readers', () => {
      render(<StatusBadge status="success" label="Complete" />);
      
      expect(screen.getByText(/success:/)).toHaveClass('sr-only');
    });
  });

  describe('ActionButton', () => {
    it('provides visual feedback during loading', () => {
      render(
        <ActionButton action="Save" status="loading">
          Save
        </ActionButton>
      );
      
      // Visual: Loading spinner is shown
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
      
      // Visual: Button contains text
      expect(button).toHaveTextContent('Save');
    });

    it('provides ARIA busy state during loading', () => {
      render(
        <ActionButton action="Save" status="loading">
          Save
        </ActionButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('announces action status to screen readers', () => {
      render(
        <ActionButton action="Save" status="loading">
          Save
        </ActionButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-live', 'polite');
      
      // Screen reader text
      expect(screen.getByText('Save in progress')).toHaveClass('sr-only');
    });

    it('shows success icon and message', () => {
      render(
        <ActionButton action="Save" status="success" successMessage="Saved!">
          Save
        </ActionButton>
      );
      
      // Visual: Success icon
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
      
      // Visual: Success message (appears twice - visible and sr-only)
      const messages = screen.getAllByText('Saved!');
      expect(messages.length).toBeGreaterThan(0);
    });

    it('disables button during loading', () => {
      render(
        <ActionButton action="Save" status="loading">
          Save
        </ActionButton>
      );
      
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('ProgressIndicator', () => {
    it('provides visual progress bar', () => {
      render(
        <ProgressIndicator label="Uploading" current={50} total={100} />
      );
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('provides textual progress information', () => {
      render(
        <ProgressIndicator label="Uploading" current={50} total={100} />
      );
      
      // Label
      expect(screen.getByText('Uploading')).toBeInTheDocument();
      
      // Percentage
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('provides ARIA progress attributes', () => {
      render(
        <ProgressIndicator label="Uploading" current={75} total={100} />
      );
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('provides detailed accessible label', () => {
      render(
        <ProgressIndicator label="Uploading" current={25} total={100} />
      );
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Uploading: 25 of 100 (25%)');
    });

    it('includes hidden detailed status for screen readers', () => {
      render(
        <ProgressIndicator label="Uploading" current={60} total={100} />
      );
      
      const hiddenStatus = screen.getByText('Uploading: 60 of 100 completed (60%)');
      expect(hiddenStatus).toHaveClass('sr-only');
    });
  });

  describe('Multi-Modal Feedback Principles', () => {
    it('never relies on color alone', () => {
      render(<StatusIndicator status="error" message="Failed" />);
      
      // Has icon (not just color)
      expect(screen.getByTitle('Error')).toBeInTheDocument();
      
      // Has text (not just color)
      expect(screen.getByText('Failed')).toBeInTheDocument();
      
      // Has screen reader text
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    it('provides text alternatives for icons', () => {
      render(<StatusIndicator status="success" message="Done" />);
      
      // Icon has title
      const icon = screen.getByTitle('Success');
      expect(icon).toBeInTheDocument();
      
      // Icon SVG is hidden from screen readers
      expect(icon.closest('svg')).toHaveAttribute('aria-hidden', 'true');
      
      // Text alternative is provided
      expect(screen.getByText(/Success:/)).toBeInTheDocument();
    });

    it('uses ARIA live regions for dynamic content', () => {
      const { container, rerender } = render(
        <StatusIndicator status="loading" message="Processing" />
      );
      
      let statusElement = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusElement).toHaveAttribute('aria-live', 'polite');
      
      // Update status
      rerender(<StatusIndicator status="success" message="Complete" />);
      
      // Still has live region
      statusElement = container.querySelector('[role="status"][aria-live="polite"]');
      expect(statusElement).toBeInTheDocument();
    });
  });
});
