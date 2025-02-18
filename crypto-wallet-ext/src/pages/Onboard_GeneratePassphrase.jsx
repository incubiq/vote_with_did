// src/pages/Onboard_GeneratePassphrase.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateMnemonic } from "../utils/bip39";
import { srv_getWalletInfo } from "../utils/identity";
import PinDialog from '../components/PinDialog';
import { useWallet } from '../state/WalletContext';
import { storage } from '../utils/storage';

import styles from '../styles/Onboarding.module.css';
import styleM from '../styles/Base.module.css';

const GeneratePassphrase = () => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const navigate = useNavigate();
  const { state, actions } = useWallet();

  const handleGeneratePassphrase = () => {
    const newPassphrase = generateMnemonic(15);
    actions.startWalletCreation(newPassphrase);
    setCopied(false);
    setConfirmed(false);
  };

  const handleCopyPassphrase = async () => {
    try {
      await navigator.clipboard.writeText(state.recoveryPhrase);
      setCopied(true);
    } catch (err) {
      actions.setError('Failed to copy recovery phrase to clipboard');
    }
  };

  const generateWallet = async () => {
    try {
      let dataWallet=await srv_getWalletInfo(state.recoveryPhrase);
      if(!dataWallet || ! dataWallet.data) {
        actions.setError('Could not create Wallet');
        return;
      }
      const userWallet = {
        address: dataWallet.data.addr,
        seed: dataWallet.data.seed,
        private: dataWallet.data.private,
      };
    
      actions.walletCreated(userWallet);
      actions.clearRecoveryPhrase(); // Clear sensitive data
      
      // Navigate to wallet dashboard or next step
      navigate('/dashboard');
    } catch (error) {
      actions.setError(error.message);
    }
  }
  
  const handleProceed = () => {
    if (!confirmed) {
      actions.setError('Please confirm that you have backed up your recovery phrase');
      return;
    }

    if(state.pin==null) {
      setShowPinSetup(true);
    }
    else {
      generateWallet();
    }
  };


  const handleSetPin = async (pin) => {
      actions.setPin(pin);
      generateWallet();
  };

  // Show any errors
  React.useEffect(() => {
    if (state.error) {
      // You could show this in a toast or alert component
      alert(state.error);
      actions.clearError();
    }
  }, [state.error]);

  return (
    <div className={styles.pageContainer}>
      <button 
        className={styleM.backButton}
        onClick={() => {
          navigate('/');
        }}
      >
        ← Back
      </button>

      <div className={styles.onboardingContainer}>
        <h1 className={styles.title}>Create New Wallet</h1>
        
        {!state.recoveryPhrase ? (
          <div>
            <p className={styles.description}>
              We'll generate a secure 15-word recovery phrase for your wallet.
              Keep it safe - it's the only way to recover your wallet!
            </p>
            <button 
              className={styles.optionButton} 
              onClick={handleGeneratePassphrase}
              disabled={state.status === 'creating'}
            >
              {state.status === 'creating' ? 'Generating...' : 'Generate Recovery Phrase'}
            </button>
          </div>
        ) : (
          <div>
            <p className={styles.description}>
              This is your wallet recovery phrase. Write it down and store it securely.
            </p>
            
            <div className={styles.passphraseDisplay}>
              <p>{state.recoveryPhrase}</p>
            </div>

            <div className={styles.buttonGroup}>
              <button 
                className={styles.optionButton} 
                onClick={handleCopyPassphrase}
              >
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </button>
              
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  id="confirm-backup"
                />
                <label htmlFor="confirm-backup">
                  I have securely stored my recovery phrase
                </label>
              </div>

              <button 
                className={styles.optionButton}
                onClick={handleProceed}
                disabled={!confirmed || state.status !== 'creating'}
              >
                {state.status === 'creating' ? 'Creating Wallet...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        )}
      </div>

      
      {showPinSetup && (
        <PinDialog
          isSetup={true}
          onSubmit={handleSetPin}
          onClose={() => {setShowPinSetup(false)}}
        />
      )}

    </div>
  );
};

export default GeneratePassphrase;