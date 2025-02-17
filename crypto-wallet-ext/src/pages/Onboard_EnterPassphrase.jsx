// src/pages/Onboard_EnterPassphrase.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { validateMnemonic } from "../utils/bip39";
import { useWallet } from '../state/WalletContext';
import styles from '../styles/Onboarding.module.css';

const EnterPassphrase = () => {
  const [passphrase, setPassphrase] = useState("");
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();
  const { state, actions } = useWallet();

  // Clear any existing state when component mounts
  useEffect(() => {
    actions.resetState();
  }, []);

  // Watch for state errors
  useEffect(() => {
    if (state.error) {
      setLocalError(state.error);
      actions.clearError();
    }
  }, [state.error]);

  const validateInput = () => {
    if (!passphrase.trim()) {
      setLocalError("Please enter your recovery phrase");
      return false;
    }

    const words = passphrase.trim().split(/\s+/);
    if (words.length !== 15) {
      setLocalError("Please enter exactly 15 words");
      return false;
    }

    if (!validateMnemonic(passphrase)) {
      setLocalError("Invalid recovery phrase. Please check each word and try again.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setLocalError("");
    
    if (!validateInput()) {
      return;
    }

    try {
      actions.startWalletLoading();
      
      // TODO: Replace this with your actual wallet loading logic
      
      // const wallet = await yourWalletLibrary.load(passphrase);
      const wallet = { address: "dummy_address" }; // Placeholder
      
      // Simulate loading DIDs and VCs
      const dids = []; // Will come from your wallet library
      const vcs = [];  // Will come from your wallet library
      
      actions.walletLoaded(wallet, dids, vcs);
      
      navigate('/dashboard');
      console.log("Wallet loaded successfully");
      
    } catch (error) {
      actions.setError(error.message || "Failed to load wallet");
    }
  };

  const handleChange = (e) => {
    setPassphrase(e.target.value);
    if (localError) setLocalError("");
  };

  const handleBack = () => {
    actions.resetState();
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      <button 
        className={styles.backButton}
        onClick={handleBack}
      >
        ← Back
      </button>

      <div className={styles.onboardingContainer}>
        <h1 className={styles.title}>Load Existing Wallet</h1>
        
        <p className={styles.description}>
          Enter your 15-word recovery phrase to access your wallet
        </p>
        
        <textarea
          className={styles.inputArea}
          placeholder="Enter your recovery phrase (15 words)..."
          value={passphrase}
          onChange={handleChange}
          rows={4}
          disabled={state.status === 'loading'}
        />
        
        {localError && (
          <p className="error">{localError}</p>
        )}

        <button 
          className={styles.optionButton} 
          onClick={handleSubmit}
          disabled={state.status === 'loading'}
        >
          {state.status === 'loading' ? 'Loading Wallet...' : 'Load Wallet'}
        </button>

        {state.status === 'loading' && (
          <p className={styles.description}>
            Please wait while we load your wallet...
          </p>
        )}
      </div>
    </div>
  );
};

export default EnterPassphrase;