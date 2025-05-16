// src/utils/encrypt.js

const SALT = new Uint8Array([119, 193, 229, 8, 191, 197, 62, 137, 198, 10, 108, 20]); // Fixed salt for PBKDF2

function uint8ArrayToHexString(array) {
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const async_getIdentusApiKey = async(wallet, saltHexString = uint8ArrayToHexString(SALT),  iterations = 10000, length = 32, format = 'urlsafe') => {
  if (!wallet  || !wallet.private || typeof wallet.private !== 'string') {
    throw new Error('Private key must be a non-empty string');
  }
  
  if (!saltHexString || typeof saltHexString !== 'string') {
    throw new Error('Salt must be a non-empty string');
  }

  try {
    const encoder = new TextEncoder();
    const privateKeyBytes = encoder.encode(wallet.private);
    const saltBytes = encoder.encode(saltHexString);
    
    // Create a combined buffer of private key and salt
    const combinedBuffer = new Uint8Array(privateKeyBytes.length + saltBytes.length);
    combinedBuffer.set(privateKeyBytes);
    combinedBuffer.set(saltBytes, privateKeyBytes.length);
    
    // Use the SubtleCrypto API to create a digest
    const hashBuffer = await crypto.subtle.digest('SHA-256', combinedBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    
    // If you need a specific length, trim or pad the array
    const resultArray = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      resultArray[i] = hashArray[i % hashArray.length];
    }
    if (format === 'hex') {
      return Array.from(resultArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else if (format === 'base64') {
      return btoa(String.fromCharCode.apply(null, resultArray));
    } else if (format === 'urlsafe') {
      // URL-safe base64: replace '+' with '-', '/' with '_', and remove '='
      return btoa(String.fromCharCode.apply(null, resultArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    } else {
      throw new Error('Invalid format. Use "hex", "base64", or "urlsafe"');
    }
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
}

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
