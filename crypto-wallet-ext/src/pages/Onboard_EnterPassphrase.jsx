// src/pages/Onboard_EnterPassphrase.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { validateMnemonic } from "../utils/bip39";
import { srv_getWalletInfo } from "../utils/identity";
import PinDialog from '../components/PinDialog';
import { useWallet } from '../state/WalletContext';

import styles from '../styles/Onboarding.module.css';
import styleM from '../styles/Base.module.css';

const EnterPassphrase = () => {
  const [passphrase, setPassphrase] = useState("");
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();
  const { state, actions } = useWallet();

  useEffect(() => {
  }, []);

  // Watch for state errors
  useEffect(() => {
    if (state.error) {
      setLocalError(state.error);
      actions.clearError();
    }
  }, [state.error]);

  // Watch for wallet loaded
  useEffect(() => {
    if (state.wallet && state.wallet.address) {
      navigate('/dashboard');
    }
  }, [state.wallet]);
  
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
 
    // Show PIN dialog for verification
    if(state.pin==null) {
      setShowPinDialog(true);
    }
    else {
      loadWallet();
    }
  }

  const loadWallet = async () => {
      try {
        actions.startWalletLoading();
        let dataWallet=await srv_getWalletInfo(passphrase);
        if(!dataWallet || ! dataWallet.data) {
          actions.setError('Could not load Wallet');
          return;
        }
  
        const userWallet = {
          address: dataWallet.data.addr,
          seed: dataWallet.data.seed,
          private: dataWallet.data.private,
        };
      
        // Simulate loading DIDs and VCs
        const dids = []; // Will come from your wallet library
        const vcs = [];  // Will come from your wallet library
        
        actions.walletLoaded(userWallet, dids, vcs);
        
        navigate('/dashboard');
        console.log("Wallet loaded successfully");
        
      } catch (error) {
        actions.setError(error.message || "Failed to load wallet");
      }
    }
    

  const handlePinSubmit = async (pin) => {
      actions.setPin(pin);
      actions.startWalletLoading();
  };

  const handleChange = (e) => {
    setPassphrase(e.target.value);
    if (localError) setLocalError("");
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      <button 
        className={styleM.backButton}
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

      {showPinDialog && (
        <PinDialog
          isSetup={true}
          onSubmit={handlePinSubmit}
          onClose={() => {setShowPinDialog(false)}}
        />
      )}
    </div>
  );
};

export default EnterPassphrase;