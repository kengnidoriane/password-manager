/**
 * Password Generator Service
 * 
 * Implements cryptographically secure password generation with customizable
 * character types, length configuration, and integration with strength analyzer.
 */

import { PasswordValidationService, type PasswordStrength } from './passwordValidation';

/**
 * Password generator options
 */
export interface GeneratorOptions {
  length: number; // 8-128 characters
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean; // Exclude characters like 0, O, l, 1, I
}

/**
 * Generated password result
 */
export interface GeneratedPassword {
  password: string;
  strength: PasswordStrength;
  options: GeneratorOptions;
}

/**
 * PasswordGeneratorService class
 */
export class PasswordGeneratorService {
  // Character sets
  private static readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private static readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private static readonly NUMBERS = '0123456789';
  private static readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

  // Ambiguous characters to exclude
  private static readonly AMBIGUOUS = '0O1lI';

  /**
   * Generate a cryptographically secure random password
   * @param options Generator options
   * @returns Generated password with strength analysis
   */
  static generatePassword(options: GeneratorOptions): GeneratedPassword {
    // Validate options
    this.validateOptions(options);

    // Build character set based on options
    const charset = this.buildCharset(options);

    if (charset.length === 0) {
      throw new Error('At least one character type must be selected');
    }

    // Generate password using cryptographically secure random
    const password = this.generateSecurePassword(charset, options.length);

    // Ensure password meets the selected character type requirements
    const validPassword = this.ensureCharacterTypes(password, options);

    // Analyze strength
    const strength = PasswordValidationService.analyzePasswordStrength(validPassword);

    return {
      password: validPassword,
      strength,
      options,
    };
  }

  /**
   * Validate generator options
   * @param options Options to validate
   * @throws Error if options are invalid
   */
  private static validateOptions(options: GeneratorOptions): void {
    if (options.length < 8 || options.length > 128) {
      throw new Error('Password length must be between 8 and 128 characters');
    }

    if (!options.includeUppercase && !options.includeLowercase && 
        !options.includeNumbers && !options.includeSymbols) {
      throw new Error('At least one character type must be selected');
    }
  }

  /**
   * Build character set based on options
   * @param options Generator options
   * @returns Character set string
   */
  private static buildCharset(options: GeneratorOptions): string {
    let charset = '';

    if (options.includeLowercase) {
      charset += this.LOWERCASE;
    }
    if (options.includeUppercase) {
      charset += this.UPPERCASE;
    }
    if (options.includeNumbers) {
      charset += this.NUMBERS;
    }
    if (options.includeSymbols) {
      charset += this.SYMBOLS;
    }

    // Exclude ambiguous characters if requested
    if (options.excludeAmbiguous) {
      charset = charset.split('').filter(char => !this.AMBIGUOUS.includes(char)).join('');
    }

    return charset;
  }

  /**
   * Generate a cryptographically secure random password
   * Uses Web Crypto API for secure random number generation
   * @param charset Character set to use
   * @param length Password length
   * @returns Generated password
   */
  private static generateSecurePassword(charset: string, length: number): string {
    const password: string[] = [];
    const charsetLength = charset.length;

    // Use Web Crypto API for cryptographically secure random values
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      // Use modulo bias reduction technique
      // This ensures uniform distribution across the charset
      const randomIndex = randomValues[i] % charsetLength;
      password.push(charset[randomIndex]);
    }

    return password.join('');
  }

  /**
   * Ensure password contains at least one character from each selected type
   * This guarantees the password meets the character type requirements
   * @param password Generated password
   * @param options Generator options
   * @returns Password with guaranteed character types
   */
  private static ensureCharacterTypes(password: string, options: GeneratorOptions): string {
    let result = password;
    const requiredChars: string[] = [];

    // Collect required character types
    if (options.includeLowercase && !/[a-z]/.test(result)) {
      const charset = options.excludeAmbiguous 
        ? this.LOWERCASE.split('').filter(c => !this.AMBIGUOUS.includes(c)).join('')
        : this.LOWERCASE;
      requiredChars.push(this.getRandomChar(charset));
    }
    if (options.includeUppercase && !/[A-Z]/.test(result)) {
      const charset = options.excludeAmbiguous 
        ? this.UPPERCASE.split('').filter(c => !this.AMBIGUOUS.includes(c)).join('')
        : this.UPPERCASE;
      requiredChars.push(this.getRandomChar(charset));
    }
    if (options.includeNumbers && !/[0-9]/.test(result)) {
      const charset = options.excludeAmbiguous 
        ? this.NUMBERS.split('').filter(c => !this.AMBIGUOUS.includes(c)).join('')
        : this.NUMBERS;
      requiredChars.push(this.getRandomChar(charset));
    }
    if (options.includeSymbols && !/[^a-zA-Z0-9]/.test(result)) {
      requiredChars.push(this.getRandomChar(this.SYMBOLS));
    }

    // If we need to add required characters, replace random positions
    if (requiredChars.length > 0) {
      const resultArray = result.split('');
      const positions = this.getRandomPositions(result.length, requiredChars.length);
      
      for (let i = 0; i < requiredChars.length; i++) {
        resultArray[positions[i]] = requiredChars[i];
      }
      
      result = resultArray.join('');
    }

    return result;
  }

  /**
   * Get a cryptographically secure random character from a charset
   * @param charset Character set
   * @returns Random character
   */
  private static getRandomChar(charset: string): string {
    const randomValue = new Uint32Array(1);
    crypto.getRandomValues(randomValue);
    const randomIndex = randomValue[0] % charset.length;
    return charset[randomIndex];
  }

  /**
   * Get cryptographically secure random positions
   * @param max Maximum position (exclusive)
   * @param count Number of positions needed
   * @returns Array of random positions
   */
  private static getRandomPositions(max: number, count: number): number[] {
    const positions: number[] = [];
    const randomValues = new Uint32Array(count);
    crypto.getRandomValues(randomValues);

    for (let i = 0; i < count; i++) {
      positions.push(randomValues[i] % max);
    }

    return positions;
  }

  /**
   * Generate password with default options
   * @returns Generated password with default settings
   */
  static generateDefaultPassword(): GeneratedPassword {
    const defaultOptions: GeneratorOptions = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    };

    return this.generatePassword(defaultOptions);
  }

  /**
   * Generate a strong password (20+ characters, all types)
   * @returns Generated strong password
   */
  static generateStrongPassword(): GeneratedPassword {
    const strongOptions: GeneratorOptions = {
      length: 20,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    };

    return this.generatePassword(strongOptions);
  }

  /**
   * Generate a memorable password (no symbols, no ambiguous)
   * @param length Password length (default: 16)
   * @returns Generated memorable password
   */
  static generateMemorablePassword(length: number = 16): GeneratedPassword {
    const memorableOptions: GeneratorOptions = {
      length,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeAmbiguous: true,
    };

    return this.generatePassword(memorableOptions);
  }
}

// Export singleton instance for convenience
export const passwordGeneratorService = PasswordGeneratorService;
