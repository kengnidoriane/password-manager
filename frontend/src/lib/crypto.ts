/**
 * CryptoService - Client-side cryptography using Web Crypto API
 * 
 * Implements zero-knowledge encryption for the Password Manager.
 * All encryption/decryption happens client-side using AES-256-GCM.
 * Master password never leaves the client.
 */

/**
 * Derived keys from master password
 */
export interface DerivedKeys {
  encryptionKey: CryptoKey;
  authKey: CryptoKey;
  salt: Uint8Array;
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encryptedData: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag (included in ciphertext for GCM)
}

/**
 * Key derivation parameters
 */
export interface KeyDerivationParams {
  salt: Uint8Array;
  iterations: number;
}

/**
 * CryptoService class for all cryptographic operations
 */
export class CryptoService {
  // Constants
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly SALT_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly KEY_LENGTH = 256; // AES-256

  /**
   * Generate cryptographically secure random bytes
   * @param length Number of bytes to generate
   * @returns Uint8Array of random bytes
   */
  static generateRandomBytes(length: number): Uint8Array {
    try {
      const buffer = new ArrayBuffer(length);
      const view = new Uint8Array(buffer);
      crypto.getRandomValues(view);
      return view;
    } catch (error) {
      throw new Error(`Failed to generate random bytes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a random salt for key derivation
   * @returns Uint8Array salt
   */
  static generateSalt(): Uint8Array {
    return this.generateRandomBytes(this.SALT_LENGTH);
  }

  /**
   * Generate a random initialization vector for encryption
   * @returns Uint8Array IV
   */
  static generateIV(): Uint8Array {
    return this.generateRandomBytes(this.IV_LENGTH);
  }

  /**
   * Derive encryption and authentication keys from master password using PBKDF2
   * @param masterPassword The user's master password
   * @param salt Salt for key derivation (generate new for registration, use stored for login)
   * @param iterations Number of PBKDF2 iterations (default: 100,000)
   * @returns Promise<DerivedKeys> containing encryption key, auth key, and salt
   */
  static async deriveKeys(
    masterPassword: string,
    salt?: Uint8Array,
    iterations: number = this.PBKDF2_ITERATIONS
  ): Promise<DerivedKeys> {
    try {
      // Validate iterations
      if (iterations < this.PBKDF2_ITERATIONS) {
        throw new Error(`Iterations must be at least ${this.PBKDF2_ITERATIONS}`);
      }

      // Generate salt if not provided
      const keySalt = salt || this.generateSalt();

      // Convert master password to key material
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(masterPassword);

      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive encryption key (first 256 bits)
      const encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: keySalt as BufferSource,
          iterations: iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: this.KEY_LENGTH },
        false, // not extractable for security
        ['encrypt', 'decrypt']
      );

      // Derive authentication key (second 256 bits) using different salt
      const authSaltBuffer = new ArrayBuffer(keySalt.length);
      const authSalt = new Uint8Array(authSaltBuffer);
      authSalt.set(keySalt);
      authSalt[0] ^= 0xFF; // Modify salt slightly for auth key

      const authKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: authSalt as BufferSource,
          iterations: iterations,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: this.KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
      );

      return {
        encryptionKey,
        authKey,
        salt: keySalt,
      };
    } catch (error) {
      throw new Error(`Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param data Data to encrypt (string or object)
   * @param encryptionKey CryptoKey for encryption
   * @returns Promise<EncryptedData> containing encrypted data, IV, and auth tag
   */
  static async encrypt(
    data: string | object,
    encryptionKey: CryptoKey
  ): Promise<EncryptedData> {
    try {
      // Convert data to string if it's an object
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // Convert string to bytes
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);

      // Generate random IV
      const iv = this.generateIV();

      // Encrypt using AES-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
        },
        encryptionKey,
        dataBuffer
      );

      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const encryptedBase64 = CryptoService.arrayBufferToBase64(encryptedArray);
      const ivBase64 = CryptoService.arrayBufferToBase64(iv);

      // For GCM, the authentication tag is included in the ciphertext
      // We'll store it separately for clarity, but it's the last 16 bytes
      const authTagLength = 16; // 128 bits
      const authTag = encryptedArray.slice(-authTagLength);
      const authTagBase64 = CryptoService.arrayBufferToBase64(authTag);

      return {
        encryptedData: encryptedBase64,
        iv: ivBase64,
        authTag: authTagBase64,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData EncryptedData object containing encrypted data, IV, and auth tag
   * @param encryptionKey CryptoKey for decryption
   * @returns Promise<string> decrypted data as string
   */
  static async decrypt(
    encryptedData: EncryptedData,
    encryptionKey: CryptoKey
  ): Promise<string> {
    try {
      // Convert base64 to Uint8Array
      const encryptedBuffer = CryptoService.base64ToArrayBuffer(encryptedData.encryptedData);
      const iv = CryptoService.base64ToArrayBuffer(encryptedData.iv);

      // Decrypt using AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as BufferSource,
        },
        encryptionKey,
        encryptedBuffer as BufferSource
      );

      // Convert bytes to string
      const decoder = new TextDecoder();
      const decryptedString = decoder.decode(decryptedBuffer);

      return decryptedString;
    } catch (error) {
      // Decryption failures often indicate wrong password or corrupted data
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Invalid key or corrupted data'}`);
    }
  }

  /**
   * Decrypt and parse JSON data
   * @param encryptedData EncryptedData object
   * @param encryptionKey CryptoKey for decryption
   * @returns Promise<T> decrypted and parsed object
   */
  static async decryptJSON<T>(
    encryptedData: EncryptedData,
    encryptionKey: CryptoKey
  ): Promise<T> {
    try {
      const decryptedString = await this.decrypt(encryptedData, encryptionKey);
      return JSON.parse(decryptedString) as T;
    } catch (error) {
      throw new Error(`Failed to decrypt JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param buffer ArrayBuffer or Uint8Array
   * @returns Base64 string
   */
  static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to Uint8Array
   * @param base64 Base64 string
   * @returns Uint8Array
   */
  static base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Hash data using SHA-256
   * @param data Data to hash
   * @returns Promise<string> Base64 encoded hash
   */
  static async hash(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return CryptoService.arrayBufferToBase64(hashBuffer);
    } catch (error) {
      throw new Error(`Hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a cryptographically secure random string
   * @param length Length of the string
   * @param charset Character set to use (default: alphanumeric)
   * @returns Random string
   */
  static generateRandomString(
    length: number,
    charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    const randomBytes = this.generateRandomBytes(length);
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset[randomBytes[i] % charset.length];
    }
    return result;
  }

  /**
   * Generate a backup recovery key for account recovery
   * Recovery keys are used to recover access if master password is forgotten
   * @returns string - A cryptographically secure recovery key
   */
  static generateRecoveryKey(): string {
    // Generate a 32-character recovery key using alphanumeric characters
    // This provides approximately 190 bits of entropy (32 * log2(62))
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return this.generateRandomString(32, charset);
  }

  /**
   * Validate that Web Crypto API is available
   * @returns boolean indicating if Web Crypto API is available
   */
  static isWebCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }
}

// Export singleton instance for convenience
export const cryptoService = CryptoService;
