/**
 * Password Validation and Strength Analysis Service
 * 
 * Implements password validation, strength analysis, entropy calculation,
 * crack time estimation, and breach checking using k-anonymity.
 */

/**
 * Password strength result
 */
export interface PasswordStrength {
  score: number; // 0-100
  entropy: number; // bits of entropy
  crackTime: string; // human-readable estimate
  crackTimeSeconds: number; // seconds to crack
  feedback: string[]; // improvement suggestions
  isWeak: boolean;
  isBreached?: boolean; // if breach check was performed
}

/**
 * Master password validation result
 */
export interface MasterPasswordValidation {
  isValid: boolean;
  errors: string[];
  meetsMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Password pattern detection
 */
interface PasswordPattern {
  type: 'sequential' | 'repeated' | 'keyboard' | 'common' | 'date';
  description: string;
  penalty: number; // entropy penalty in bits
}

/**
 * PasswordValidationService class
 */
export class PasswordValidationService {
  // Character sets
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly NUMBERS = '0123456789';
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

  // Common weak passwords (subset for pattern detection)
  private static readonly COMMON_PASSWORDS = new Set([
    'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon', 'baseball',
    'iloveyou', 'master', 'sunshine', 'ashley', 'bailey', 'passw0rd',
    'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael',
    'football', 'welcome', 'jesus', 'ninja', 'mustang', 'password1'
  ]);

  // Keyboard patterns
  private static readonly KEYBOARD_PATTERNS = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
    '1qaz2wsx', 'qazwsx', '!qaz@wsx', '1234567890'
  ];

  /**
   * Validate master password against requirements
   * Requirements: 12+ chars, mixed case, numbers, symbols
   * @param password Password to validate
   * @returns MasterPasswordValidation result
   */
  static validateMasterPassword(password: string): MasterPasswordValidation {
    const errors: string[] = [];
    
    const meetsMinLength = password.length >= 12;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    if (!meetsMinLength) {
      errors.push('Password must be at least 12 characters long');
    }
    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasNumber) {
      errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
      meetsMinLength,
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSpecialChar,
    };
  }

  /**
   * Analyze password strength with entropy calculation
   * @param password Password to analyze
   * @returns PasswordStrength result
   */
  static analyzePasswordStrength(password: string): PasswordStrength {
    // Calculate base entropy
    const charsetSize = this.calculateCharsetSize(password);
    const baseEntropy = password.length * Math.log2(charsetSize);

    // Detect patterns and apply penalties
    const patterns = this.detectPatterns(password);
    const patternPenalty = patterns.reduce((sum, p) => sum + p.penalty, 0);
    
    // Final entropy (minimum 0)
    const entropy = Math.max(0, baseEntropy - patternPenalty);

    // Calculate crack time
    const crackTimeSeconds = this.calculateCrackTime(entropy);
    const crackTime = this.formatCrackTime(crackTimeSeconds);

    // Generate feedback
    const feedback = this.generateFeedback(password, patterns, entropy);

    // Calculate score (0-100)
    // Score based on entropy: 0-40 bits = 0-100 score
    const score = Math.min(100, Math.round((entropy / 80) * 100));

    // Determine if weak (entropy < 50 bits or score < 60)
    const isWeak = entropy < 50 || score < 60;

    return {
      score,
      entropy,
      crackTime,
      crackTimeSeconds,
      feedback,
      isWeak,
    };
  }

  /**
   * Calculate the size of the character set used in the password
   * @param password Password to analyze
   * @returns Character set size
   */
  private static calculateCharsetSize(password: string): number {
    let size = 0;
    
    if (/[a-z]/.test(password)) size += 26; // lowercase
    if (/[A-Z]/.test(password)) size += 26; // uppercase
    if (/[0-9]/.test(password)) size += 10; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) size += 32; // symbols (approximate)

    return size || 1; // minimum 1 to avoid division by zero
  }

  /**
   * Detect common password patterns
   * @param password Password to analyze
   * @returns Array of detected patterns
   */
  private static detectPatterns(password: string): PasswordPattern[] {
    const patterns: PasswordPattern[] = [];
    const lowerPassword = password.toLowerCase();

    // Check for common passwords
    if (this.COMMON_PASSWORDS.has(lowerPassword)) {
      patterns.push({
        type: 'common',
        description: 'This is a commonly used password',
        penalty: 20,
      });
    }

    // Check for keyboard patterns
    for (const pattern of this.KEYBOARD_PATTERNS) {
      if (lowerPassword.includes(pattern)) {
        patterns.push({
          type: 'keyboard',
          description: 'Contains keyboard pattern',
          penalty: 10,
        });
        break;
      }
    }

    // Check for sequential characters (abc, 123, etc.)
    if (this.hasSequentialChars(password)) {
      patterns.push({
        type: 'sequential',
        description: 'Contains sequential characters',
        penalty: 8,
      });
    }

    // Check for repeated characters (aaa, 111, etc.)
    if (this.hasRepeatedChars(password)) {
      patterns.push({
        type: 'repeated',
        description: 'Contains repeated characters',
        penalty: 5,
      });
    }

    // Check for date patterns (1990, 2023, etc.)
    if (this.hasDatePattern(password)) {
      patterns.push({
        type: 'date',
        description: 'Contains date pattern',
        penalty: 5,
      });
    }

    return patterns;
  }

  /**
   * Check for sequential characters
   * @param password Password to check
   * @returns True if sequential characters found
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
    ];

    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 3; i++) {
        const substring = seq.substring(i, i + 3);
        if (password.includes(substring) || password.includes(substring.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for repeated characters
   * @param password Password to check
   * @returns True if repeated characters found
   */
  private static hasRepeatedChars(password: string): boolean {
    // Check for 3 or more repeated characters
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Check for date patterns
   * @param password Password to check
   * @returns True if date pattern found
   */
  private static hasDatePattern(password: string): boolean {
    // Check for 4-digit years (1900-2099)
    return /19\d{2}|20\d{2}/.test(password);
  }

  /**
   * Calculate estimated crack time based on entropy
   * Assumes 10 billion guesses per second (modern GPU)
   * @param entropy Entropy in bits
   * @returns Crack time in seconds
   */
  private static calculateCrackTime(entropy: number): number {
    const possibleCombinations = Math.pow(2, entropy);
    const guessesPerSecond = 10_000_000_000; // 10 billion
    
    // Average time to crack (half the keyspace)
    return possibleCombinations / (2 * guessesPerSecond);
  }

  /**
   * Format crack time into human-readable string
   * @param seconds Crack time in seconds
   * @returns Human-readable string
   */
  private static formatCrackTime(seconds: number): string {
    if (seconds < 1) {
      return 'Instant';
    } else if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    } else if (seconds < 86400) {
      return `${Math.round(seconds / 3600)} hours`;
    } else if (seconds < 2592000) {
      return `${Math.round(seconds / 86400)} days`;
    } else if (seconds < 31536000) {
      return `${Math.round(seconds / 2592000)} months`;
    } else if (seconds < 3153600000) {
      return `${Math.round(seconds / 31536000)} years`;
    } else if (seconds < 31536000000) {
      return `${Math.round(seconds / 315360000)} decades`;
    } else {
      return 'Centuries';
    }
  }

  /**
   * Generate feedback for password improvement
   * @param password Password being analyzed
   * @param patterns Detected patterns
   * @param entropy Calculated entropy
   * @returns Array of feedback strings
   */
  private static generateFeedback(
    password: string,
    patterns: PasswordPattern[],
    entropy: number
  ): string[] {
    const feedback: string[] = [];

    // Pattern-based feedback
    for (const pattern of patterns) {
      feedback.push(pattern.description);
    }

    // Length-based feedback
    if (password.length < 12) {
      feedback.push('Use at least 12 characters for better security');
    } else if (password.length < 16) {
      feedback.push('Consider using 16+ characters for stronger security');
    }

    // Character variety feedback
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    if (!hasLower) feedback.push('Add lowercase letters');
    if (!hasUpper) feedback.push('Add uppercase letters');
    if (!hasNumber) feedback.push('Add numbers');
    if (!hasSymbol) feedback.push('Add special characters');

    // Entropy-based feedback
    if (entropy < 40) {
      feedback.push('This password is very weak and easily crackable');
    } else if (entropy < 60) {
      feedback.push('This password could be stronger');
    } else if (entropy >= 80) {
      feedback.push('This is a strong password');
    }

    // If no issues found
    if (feedback.length === 0) {
      feedback.push('Good password strength');
    }

    return feedback;
  }

  /**
   * Check if password has been breached using k-anonymity (Have I Been Pwned API)
   * Uses k-anonymity: only sends first 5 chars of SHA-1 hash
   * @param password Password to check
   * @returns Promise<boolean> true if breached, false if safe
   */
  static async checkPasswordBreach(password: string): Promise<boolean> {
    try {
      // Hash the password with SHA-1
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      // Use k-anonymity: send only first 5 characters
      const prefix = hashHex.substring(0, 5);
      const suffix = hashHex.substring(5);

      // Query Have I Been Pwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        method: 'GET',
        headers: {
          'Add-Padding': 'true', // Request padding for additional privacy
        },
      });

      if (!response.ok) {
        // If API fails, return false (assume not breached rather than blocking user)
        console.warn('Breach check API failed:', response.status);
        return false;
      }

      const text = await response.text();
      const hashes = text.split('\n');

      // Check if our suffix appears in the results
      for (const line of hashes) {
        const [hashSuffix] = line.split(':');
        if (hashSuffix === suffix) {
          return true; // Password found in breach database
        }
      }

      return false; // Password not found in breach database
    } catch (error) {
      // If any error occurs, return false (fail open for better UX)
      console.error('Error checking password breach:', error);
      return false;
    }
  }

  /**
   * Comprehensive password analysis including breach check
   * @param password Password to analyze
   * @param checkBreach Whether to check for breaches (default: true)
   * @returns Promise<PasswordStrength> with breach status
   */
  static async analyzePasswordWithBreachCheck(
    password: string,
    checkBreach: boolean = true
  ): Promise<PasswordStrength> {
    const strength = this.analyzePasswordStrength(password);

    if (checkBreach) {
      const isBreached = await this.checkPasswordBreach(password);
      strength.isBreached = isBreached;

      if (isBreached) {
        strength.feedback.unshift('⚠️ This password has been found in data breaches');
        strength.isWeak = true;
        strength.score = Math.min(strength.score, 30); // Cap score at 30 for breached passwords
      }
    }

    return strength;
  }
}

// Export singleton instance for convenience
export const passwordValidationService = PasswordValidationService;
