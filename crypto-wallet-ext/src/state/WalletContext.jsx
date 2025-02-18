// src/state/WalletContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';

// Initial state
const initialState = {
// wallet
  pin: null,      // the pin for accessing wallet without requiring re-enter full passphrase
  wallet: null,    // wallet object when created/loaded

// Identity
  identus: null,   // the identus info about this user / wallet 
  dids: [],        // array of DIDs
  vcs: [],         // array of VCs

// vote
  ballots: [],      
  votes: [],        

// status & error mgt
  status: 'idle', // idle, creating, loading, ready, error
  error: null,     // any error messages,
  recoveryPhrase: null
};

// Action types
export const ACTIONS = {
  PIN_SET: 'PIN_SET',
  START_WALLET_CREATION: 'START_WALLET_CREATION',
  WALLET_CREATED: 'WALLET_CREATED',
  START_WALLET_LOADING: 'START_WALLET_LOADING',
  WALLET_LOADED: 'WALLET_LOADED',
  IDENTUS_LOADED: 'IDENTUS_LOADED',
  SET_DIDS: 'SET_DIDS',
  SET_VCS: 'SET_VCS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_RECOVERY_PHRASE: 'CLEAR_RECOVERY_PHRASE',
  RESET_WALLET: 'RESET_WALLET',
};

function walletReducer(state, action) {
  switch (action.type) {

    case ACTIONS.PIN_SET:
      return {
        ...state,
        status: 'pin set',
        error: null,
        pin: action.payload.pin,
      };

    case ACTIONS.START_WALLET_CREATION:
      return {
        ...state,
        status: 'creating',
        error: null,
        recoveryPhrase: action.payload.recoveryPhrase,
      };

    case ACTIONS.WALLET_CREATED:
      return {
        ...state,
        status: 'ready',
        wallet: action.payload.wallet,
        error: null,
      };

    case ACTIONS.START_WALLET_LOADING:
      return {
        ...state,
        status: 'loading',
        error: null
      };

    case ACTIONS.WALLET_LOADED:
      return {
        ...state,
        status: 'ready',
        wallet: action.payload.wallet,
        error: null
      };

    case ACTIONS.IDENTUS_LOADED:
      return {
        ...state,
        status: 'identus_ready',
        identus: action.payload.identus,
        error: null
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        status: 'error',
        error: action.payload.error
      };

    case ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case ACTIONS.SET_DIDS:
      return {
        ...state,
        dids: action.payload.dids,
      };

    case ACTIONS.SET_VCS:
      return {
        ...state,
        vcs: action.payload.vcs,
      };

    case ACTIONS.CLEAR_RECOVERY_PHRASE:
      return {
        ...state,
        recoveryPhrase: null,
      };
  
    case ACTIONS.RESET_WALLET:
      return initialState;

    default:
      return state;
  }
}

// Create context
const WalletContext = createContext(null);



export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
 
  // Load stored state on mount
  useEffect(() => {
    const loadStoredState = async () => {
      try {

        const _pin = await storage.async_loadPin()
        dispatch({
          type: ACTIONS.PIN_SET,
          payload: { pin: _pin }
        });
      
        const storedState = await storage.async_loadWallet();
        if (storedState && storedState.wallet) {

          dispatch({
            type: ACTIONS.WALLET_LOADED,
            payload: { wallet: storedState.wallet }
          });
        }

        if (storedState && storedState.identus) {

          dispatch({
            type: ACTIONS.IDENTUS_LOADED,
            payload: { identus: storedState.identus }
          });

          // now check on DIDs / VCs live
          // TODO
        }

      } catch (error) {
        console.error('Failed to load stored state:', error);
      }
    };

    loadStoredState();
  }, []);

  const actions = {
    setPin: async(pin) => {
      await storage.async_savePin(pin);
      dispatch({ 
        type: ACTIONS.PIN_SET, 
        payload: { pin } 
      });
    },

    startWalletCreation: (recoveryPhrase) => {
      dispatch({ 
        type: ACTIONS.START_WALLET_CREATION, 
        payload: { recoveryPhrase } 
      });
    },

    walletCreated: async (wallet) => {
      try {
        await storage.saveWallet({ wallet });
        dispatch({ 
          type: ACTIONS.WALLET_CREATED, 
          payload: { wallet } 
        });
      }
      catch (error) {
        console.error('Failed to save wallet:', error);
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: { error: 'Failed to save wallet' }
        });
      }
    },

    startWalletLoading: () => {
      dispatch({ type: ACTIONS.START_WALLET_LOADING });
    },

    walletLoaded: (wallet) => {
      dispatch({ 
        type: ACTIONS.WALLET_LOADED, 
        payload: { wallet } 
      });
    },

    identusLoaded: (identus) => {
      dispatch({ 
        type: ACTIONS.IDENTUS_LOADED, 
        payload: { identus } 
      });
    },

    identusDiDSet: ( dids = []) => {
      dispatch({ 
        type: ACTIONS.SET_DIDS, 
        payload: { dids } 
      });
    },

    identusVCSet: ( vcs = []) => {
      dispatch({ 
        type: ACTIONS.SET_VCS, 
        payload: { vcs } 
      });
    },

    setError: (error) => {
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: { error } 
      });
    },

    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },

    clearRecoveryPhrase: () => {
      dispatch({ type: ACTIONS.CLEAR_RECOVERY_PHRASE });
    },

    resetWallet: async() => {
      try{
        await storage.async_clearWallet();
        dispatch({ type: ACTIONS.RESET_WALLET });
      } catch (error) {
        console.error('Failed to clear wallet :', error);
      }      
    }
  };

  return (
    <WalletContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook for using the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}