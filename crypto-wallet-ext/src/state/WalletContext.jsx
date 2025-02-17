// src/state/WalletContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { storage } from '../utils/storage';

// Initial state
const initialState = {
  status: 'idle', // idle, creating, loading, ready, error
  wallet: null,    // wallet object when created/loaded
  dids: [],        // array of DIDs
  vcs: [],         // array of VCs
  error: null,     // any error messages,
  recoveryPhrase: null
};

// Action types
export const ACTIONS = {
  START_WALLET_CREATION: 'START_WALLET_CREATION',
  WALLET_CREATED: 'WALLET_CREATED',
  START_WALLET_LOADING: 'START_WALLET_LOADING',
  WALLET_LOADED: 'WALLET_LOADED',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_DIDS: 'SET_DIDS',
  SET_VCS: 'SET_VCS',
  CLEAR_RECOVERY_PHRASE: 'CLEAR_RECOVERY_PHRASE',
  RESET_STATE: 'RESET_STATE',
};

function walletReducer(state, action) {
  switch (action.type) {
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
        dids: action.payload.dids || [],
        vcs: action.payload.vcs || [],
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
  
    case ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

// Create context
const WalletContext = createContext(null);



export function WalletProvider({ children }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const actions = {
    startWalletCreation: (recoveryPhrase) => {
      dispatch({ 
        type: ACTIONS.START_WALLET_CREATION, 
        payload: { recoveryPhrase } 
      });
    },

    walletCreated: (wallet) => {
      dispatch({ 
        type: ACTIONS.WALLET_CREATED, 
        payload: { wallet } 
      });
    },

    startWalletLoading: () => {
      dispatch({ type: ACTIONS.START_WALLET_LOADING });
    },

    walletLoaded: (wallet, dids = [], vcs = []) => {
      dispatch({ 
        type: ACTIONS.WALLET_LOADED, 
        payload: { wallet, dids, vcs } 
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

    resetState: () => {
      dispatch({ type: ACTIONS.RESET_STATE });
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