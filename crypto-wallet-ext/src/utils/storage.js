// src/utils/storage.js

import { async_deriveKeyFromPin, encryptData, decryptData } from '../utils/encrypt';

const STORAGE_IDENTITY = 'VwD_IDENTITY';
const STORAGE_WALLET = 'VwD_WALLET';
const STORAGE_PIN = "VwD_PIN"

const saveToStorage = (entry, _obj) => {
  if(entry!=null) {
    localStorage.setItem(entry, JSON.stringify(_obj));
  }
}

const loadFromStorage = (entry) => {
  let _ret=localStorage.getItem(entry);  
  return JSON.parse(_ret);
}

const removeStorage = (entry) => {
  localStorage.removeItem(entry);
}


// Storage interface
export const storage = {

/*
 *      WALLET
 */

  // Save state to extension storage
  async saveWallet(state) {
    try {

      // one iv / key per saved session
      let objPin = await this.async_loadPin();
      if(!objPin) {
        throw new Error('No PIN');
      }

      const key = await async_deriveKeyFromPin(objPin.pin);
      const iv = crypto.getRandomValues(new Uint8Array(12));
  
      // Filter out sensitive data that shouldn't be persisted
      const stateToSave = {
        ...state,
        recoveryPhrase: null, // Never persist the recovery phrase
      };

      // Encrypt wallet data if it exists
      if (state.wallet) {
        const encryptedWallet = await encryptData(state.wallet, iv, key);
        stateToSave.wallet = Array.from(new Uint8Array(encryptedWallet));
      }

      // Encrypt DIDs and VCs
      if (state.dids && state.dids.length > 0) {
        const encryptedDids = await encryptData(state.dids. iv, key);
        stateToSave.dids = Array.from(new Uint8Array(encryptedDids));
      }

      if (state.vcs && state.vcs.length > 0) {
        const encryptedVcs = await encryptData(state.vcs, iv, key);
        stateToSave.vcs = Array.from(new Uint8Array(encryptedVcs));
      }

      // Save to extension storage
      stateToSave.iv=Array.from(iv);
      stateToSave.created_at= new Date(new Date().toUTCString());
      saveToStorage(STORAGE_WALLET, stateToSave);

      return true;
    } catch (error) {
      console.error('Save state error:', error);
      throw new Error('Failed to save wallet state');
    }
  },

  // Load state from extension storage
  async loadWallet() {
    try {
      const storedPin  = await this.async_loadPin();
      if(!storedPin) {
        return;
      }
      const key = await async_deriveKeyFromPin(storedPin.pin)

      const storedWallet  = loadFromStorage(STORAGE_WALLET);
      if(!storedWallet) {
        return;
      }
      const { wallet, iv } = storedWallet; 
      if (!wallet || !iv) {
        return null;
      }

      // Decrypt wallet data if it exists
      const walletState = await decryptData(wallet, iv, key);
      return walletState;

    } catch (error) {
      console.error('Load state error:', error);
      throw new Error('Failed to load wallet state');
    }
  },

  // Clear all stored state
  async clearWallet() {
    try {
      removeStorage(STORAGE_KEY);
      return true;
    } catch (error) {
      return false;
    }
  },

/*
 *      IDENTITY (DIDs  VCs)
 */


/*
 *      PIN
 */

  _isMoreThan5DaysAgo(date) {
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
    const now = new Date();
    return (now - date) > fiveDaysInMs;
  },

  async async_savePin(_pin) {
    try {
      saveToStorage(STORAGE_PIN, {
        pin: _pin,
        lastChecked_at: new Date(new Date().toUTCString())
      });
      return true;
    }
    catch(err) {
      return false;
    }
  },

  async async_loadPin() {
    try {
      const objPin= loadFromStorage(STORAGE_PIN);
      if(objPin.lastChecked_at) {
        const _oldDate=new Date(objPin.lastChecked_at);
        if(this._isMoreThan5DaysAgo(_oldDate)) {
          // force a recheck
          // TODO
        }
      }
      return objPin? objPin.pin: null;
    }
    catch(err) {
      return null;
    }
  },

  async async_clearPin(_pin) {
    try {
      removeStorage(STORAGE_PIN);
      return true;
    } catch (error) {
      return false;
    }    
  },

};