// src/utils/encrypt.js

const SALT = new Uint8Array([119, 193, 229, 8, 191, 197, 62, 137, 198, 10, 108, 20]); // Fixed salt for PBKDF2

// Derive an encryption key from the PIN
export const async_deriveKeyFromPin = async (pin) => {
  const encoder = new TextEncoder();
  const pinData = encoder.encode(pin);
  
  // Pad or truncate to exactly 32 bytes for AES-256
  const keyBuffer = new Uint8Array(32);
  keyBuffer.set(pinData.slice(0, 32)); 

  // Convert PIN to key material
  const pinBuffer = new TextEncoder().encode(pin);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the actual encryption key
  const _key=await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

   return _key;
}

// Encrypt data
export const encryptData = async (data, iv, key) => {
  try {
    const encodedData = new TextEncoder().encode(JSON.stringify(data));
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      encodedData
    );

    return encryptedData;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Decrypt data
export const decryptData = async (encryptedData, iv, key) => {
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      new Uint8Array(encryptedData)
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};
