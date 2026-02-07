/**
 * Utility functions for WCAG contrast ratio calculations
 * 
 * WCAG 2.1 AA Requirements:
 * - Normal text (< 18pt or < 14pt bold): 4.5:1 minimum
 * - Large text (>= 18pt or >= 14pt bold): 3:1 minimum
 * - UI components and graphical objects: 3:1 minimum
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  if (hex.length !== 6) {
    return null;
  }
  
  // Validate hex characters
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Check for NaN
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }
  
  return { r, g, b };
}

/**
 * Convert RGB to relative luminance
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map(val => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Formula from WCAG 2.1: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = getRelativeLuminance(color1.r, color1.g, color1.b);
  const l2 = getRelativeLuminance(color2.r, color2.g, color2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG 2.1 AA standards
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) {
    return { passes: false, ratio: 0, required: isLargeText ? 3 : 4.5 };
  }
  
  const ratio = getContrastRatio(fg, bg);
  const required = isLargeText ? 3 : 4.5;
  
  return {
    passes: ratio >= required,
    ratio,
    required,
  };
}

/**
 * Check if contrast ratio meets WCAG 2.1 AAA standards
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) {
    return { passes: false, ratio: 0, required: isLargeText ? 4.5 : 7 };
  }
  
  const ratio = getContrastRatio(fg, bg);
  const required = isLargeText ? 4.5 : 7;
  
  return {
    passes: ratio >= required,
    ratio,
    required,
  };
}

/**
 * Extract computed color from element
 */
export function getComputedColor(element: Element, property: 'color' | 'backgroundColor'): string | null {
  if (!(element instanceof HTMLElement)) {
    return null;
  }
  
  const computed = window.getComputedStyle(element);
  const value = computed[property];
  
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
    // For transparent backgrounds, traverse up to find actual background
    if (property === 'backgroundColor' && element.parentElement) {
      return getComputedColor(element.parentElement, property);
    }
    return null;
  }
  
  return rgbToHex(value);
}

/**
 * Convert RGB/RGBA string to hex
 */
export function rgbToHex(rgb: string): string | null {
  // Match rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  
  if (!match) {
    // Already hex or invalid
    if (rgb.startsWith('#')) {
      return rgb;
    }
    return null;
  }
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Check if text is considered "large" by WCAG standards
 * Large text is >= 18pt (24px) or >= 14pt (18.66px) bold
 */
export function isLargeText(element: Element): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }
  
  const computed = window.getComputedStyle(element);
  const fontSize = parseFloat(computed.fontSize);
  const fontWeight = computed.fontWeight;
  
  // >= 18pt (24px)
  if (fontSize >= 24) {
    return true;
  }
  
  // >= 14pt (18.66px) and bold (>= 700)
  if (fontSize >= 18.66 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700)) {
    return true;
  }
  
  return false;
}

/**
 * Get all text-containing elements from a container
 */
export function getTextElements(container: HTMLElement): Element[] {
  const textElements: Element[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (!(node instanceof HTMLElement)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip hidden elements
        if (node.offsetParent === null) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Check if element has text content (not just whitespace)
        const hasText = node.textContent?.trim().length ?? 0 > 0;
        
        // Check if element has direct text nodes (not just from children)
        const hasDirectText = Array.from(node.childNodes).some(
          child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
        );
        
        if (hasText && hasDirectText) {
          return NodeFilter.FILTER_ACCEPT;
        }
        
        return NodeFilter.FILTER_SKIP;
      },
    }
  );
  
  let node;
  while ((node = walker.nextNode())) {
    textElements.push(node as Element);
  }
  
  return textElements;
}

/**
 * Check contrast for a single element
 */
export function checkElementContrast(element: Element): {
  passes: boolean;
  ratio: number;
  required: number;
  foreground: string | null;
  background: string | null;
  isLarge: boolean;
} {
  const foreground = getComputedColor(element, 'color');
  const background = getComputedColor(element, 'backgroundColor');
  const isLarge = isLargeText(element);
  
  if (!foreground || !background) {
    return {
      passes: false,
      ratio: 0,
      required: isLarge ? 3 : 4.5,
      foreground,
      background,
      isLarge,
    };
  }
  
  const result = meetsWCAGAA(foreground, background, isLarge);
  
  return {
    ...result,
    foreground,
    background,
    isLarge,
  };
}
