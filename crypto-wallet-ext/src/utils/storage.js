// src/utils/storage.js

// Encryption key management
const getEncryptionKey = async () => {
  // In a real implementation, this would be more sophisticated
  // For now, we'll use a simple key derivation
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
  return key;
};

// Encrypt data
const encryptData = async (data) => {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encodedData
    );

    return {
      encrypted: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

const saveToStorage = (entry, value) => {
  if(entry!=null) {
    localStorage.setItem(entry, value);
  }
}

const loadFromStorage = (entry) => {
  let _ret=localStorage.getItem(entry);  
  return _ret;
}

const removeStorage = (entry) => {
  localStorage.removeItem(entry);
}

// Decrypt data
const decryptData = async (encryptedData, iv) => {
  try {
    const key = await getEncryptionKey();
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

// Storage interface
export const storage = {
  // Save state to extension storage
  async saveState(state) {
    try {
      // Filter out sensitive data that shouldn't be persisted
      const stateToSave = {
        ...state,
        recoveryPhrase: null, // Never persist the recovery phrase
      };

      // Encrypt wallet data if it exists
      if (state.wallet) {
        const encryptedWallet = await encryptData(state.wallet);
        stateToSave.wallet = encryptedWallet;
      }

      // Encrypt DIDs and VCs
      if (state.dids.length > 0) {
        const encryptedDids = await encryptData(state.dids);
        stateToSave.dids = encryptedDids;
      }

      if (state.vcs.length > 0) {
        const encryptedVcs = await encryptData(state.vcs);
        stateToSave.vcs = encryptedVcs;
      }

      // Save to extension storage
      saveToStorage("walletState", stateToSave);
      return true;
    } catch (error) {
      console.error('Save state error:', error);
      throw new Error('Failed to save wallet state');
    }
  },

  // Load state from extension storage
  async loadState() {
    try {
      const walletState  = loadFromStorage('walletState');
      
      if (!walletState) {
        return null;
      }

      // Decrypt wallet data if it exists
      if (walletState.wallet) {
        const { encrypted, iv } = walletState.wallet;
        walletState.wallet = await decryptData(encrypted, iv);
      }

      // Decrypt DIDs and VCs
      if (walletState.dids) {
        const { encrypted, iv } = walletState.dids;
        walletState.dids = await decryptData(encrypted, iv);
      }

      if (walletState.vcs) {
        const { encrypted, iv } = walletState.vcs;
        walletState.vcs = await decryptData(encrypted, iv);
      }

      return walletState;
    } catch (error) {
      console.error('Load state error:', error);
      throw new Error('Failed to load wallet state');
    }
  },

  // Clear all stored state
  async clearState() {
    try {
      removeStorage('walletState');
      return true;
    } catch (error) {
      return false;
    }
  }
};