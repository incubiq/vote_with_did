// src/state/RequirementsContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { srv_getRequirements } from '../utils/rpc_ballot';

// Initial state
const initialState = {
  requirements: [],
  status: 'idle', // idle, loading, ready, error
  error: null,
  lastFetched: null
};

// Action types
export const ACTIONS = {
  START_LOADING: 'START_LOADING',
  LOAD_SUCCESS: 'LOAD_SUCCESS',
  LOAD_ERROR: 'LOAD_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

function settingsReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_LOADING:
      return {
        ...state,
        status: 'loading',
        error: null
      };

    case ACTIONS.LOAD_SUCCESS:
      return {
        ...state,
        status: 'ready',
        requirements: action.payload.requirements,
        lastFetched: new Date(),
        error: null
      };

    case ACTIONS.LOAD_ERROR:
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

    default:
      return state;
  }
}

// Create context
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  // Load requirements on mount
  useEffect(() => {
    loadRequirements();
  }, []);

  const loadRequirements = async () => {
    try {
      dispatch({ type: ACTIONS.START_LOADING });
      
      const response = await srv_getRequirements();
      
      if (response && response.data) {
        dispatch({
          type: ACTIONS.LOAD_SUCCESS,
          payload: { requirements: response.data }
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to load requirements:', error);
      dispatch({
        type: ACTIONS.LOAD_ERROR,
        payload: { error: error.message || 'Failed to load requirements' }
      });
    }
  };

  const actions = {
    reload: loadRequirements,
    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },
    
    // Helper functions for easy access
    getRequirements: () => state.requirements,
    
    getRequirementByValue: (value) => {
      return state.requirements.find(req => req.value === value) || null;
    },
    
    getRequirementInClear: (value) => {
      const requirement = state.requirements.find(req => req.value === value);
      return requirement ? requirement.text : 'Unknown';
    }
  };

  return (
    <SettingsContext.Provider value={{ state, actions }}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook for using the requirements context
export function useRequirements() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}