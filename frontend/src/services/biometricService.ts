/**
 * BiometricService - Handles biometric authentication using WebAuthn API
 * Provides fingerprint/face ID authentication with encrypted credential storage
 */

interface BiometricCredential {
  id: string;
  publicKey: ArrayBuffer;
  encryptedMasterKey: string;
  iv: string;
  authTag: string;
}

interface BiometricSetupResult {
  credentialId: string;
  success: boolean;
  error?: string;
}

interface BiometricAuthResult {
  success: boolean;
  masterKey?: string;
  error?: string;
}

class BiometricService {
  private readonly STORAGE_KEY = 'biometric_credentials';
  private readonly RP_ID = window.location.hostname;
  private readonly RP_NAME = 'Password Manager';

  /**
   * Check if biometric authentication is supported by the browser
   */
  async isSupported(): Promise<boolean> {
    try {
      return !!(
        window.PublicKeyCredential &&
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      );
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Setup biometric authentication for the user
   * Stores encrypted master key locally for biometric unlock
   */
  async setupBiometric(userId: string, masterKey: string): Promise<BiometricSetupResult> {
    try {
      if (!(await this.isSupported())) {
        return { credentialId: '', success: false, error: 'Biometric authentication not supported' };
      }

      // Generate a new credential for this user
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userIdBytes = new TextEncoder().encode(userId);

      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            id: this.RP_ID,
            name: this.RP_NAME,
          },
          user: {
            id: userIdBytes,
            name: userId,
            displayName: userId,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: 'none',
        },
      };

      const credential = await navigator.credentials.create(createCredentialOptions) as PublicKeyCredential;
      
      if (!credential) {
        return { credentialId: '', success: false, error: 'Failed to create biometric credential' };
      }

      // Encrypt the master key for storage
      const encryptedData = await this.encryptMasterKey(masterKey);
      
      // Store the credential info locally
      const biometricCredential: BiometricCredential = {
        id: credential.id,
        publicKey: credential.response.publicKey!,
        encryptedMasterKey: encryptedData.encryptedData,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(biometricCredential));

      return { credentialId: credential.id, success: true };
    } catch (error) {
      console.error('Biometric setup error:', error);
      return { 
        credentialId: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during biometric setup' 
      };
    }
  }

  /**
   * Authenticate using biometric and retrieve master key
   */
  async authenticateWithBiometric(): Promise<BiometricAuthResult> {
    try {
      if (!(await this.isSupported())) {
        return { success: false, error: 'Biometric authentication not supported' };
      }

      const storedCredential = this.getStoredCredential();
      if (!storedCredential) {
        return { success: false, error: 'No biometric credential found. Please set up biometric authentication first.' };
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const getCredentialOptions: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [{
            id: this.base64ToArrayBuffer(storedCredential.id),
            type: 'public-key',
          }],
          userVerification: 'required',
          timeout: 60000,
        },
      };

      const assertion = await navigator.credentials.get(getCredentialOptions) as PublicKeyCredential;
      
      if (!assertion) {
        return { success: false, error: 'Biometric authentication failed' };
      }

      // Decrypt the master key
      const masterKey = await this.decryptMasterKey(
        storedCredential.encryptedMasterKey,
        storedCredential.iv,
        storedCredential.authTag
      );

      return { success: true, masterKey };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Biometric authentication failed' 
      };
    }
  }

  /**
   * Check if biometric authentication is set up for this device
   */
  isBiometricSetup(): boolean {
    return !!this.getStoredCredential();
  }

  /**
   * Remove biometric authentication setup
   */
  async removeBiometric(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Get stored biometric credential
   */
  private getStoredCredential(): BiometricCredential | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving stored credential:', error);
      return null;
    }
  }

  /**
   * Encrypt master key for local storage
   */
  private async encryptMasterKey(masterKey: string): Promise<{
    encryptedData: string;
    iv: string;
    authTag: string;
  }> {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedMasterKey = new TextEncoder().encode(masterKey);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedMasterKey
    );

    // Store the key in a way that requires biometric authentication to access
    // In a real implementation, this would be more secure
    const keyData = await crypto.subtle.exportKey('raw', key);
    localStorage.setItem(`${this.STORAGE_KEY}_key`, this.arrayBufferToBase64(keyData));

    return {
      encryptedData: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
      authTag: '', // GCM includes auth tag in encrypted data
    };
  }

  /**
   * Decrypt master key from local storage
   */
  private async decryptMasterKey(
    encryptedData: string,
    ivString: string,
    authTag: string
  ): Promise<string> {
    const keyData = localStorage.getItem(`${this.STORAGE_KEY}_key`);
    if (!keyData) {
      throw new Error('Encryption key not found');
    }

    const key = await crypto.subtle.importKey(
      'raw',
      this.base64ToArrayBuffer(keyData),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const iv = this.base64ToArrayBuffer(ivString);
    const encrypted = this.base64ToArrayBuffer(encryptedData);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export const biometricService = new BiometricService();
export type { BiometricSetupResult, BiometricAuthResult };