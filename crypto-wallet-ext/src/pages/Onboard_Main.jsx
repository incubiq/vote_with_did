// src/pages/Onboard_Main.jsx
import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useWallet } from '../state/WalletContext';

import styles from '../styles/Onboarding.module.css';

const Onboarding = () => {
  const { state, actions } = useWallet();
  
  const navigate = useNavigate();

    
  useEffect(() => {
    if(state.wallet && state.wallet.address) {
      navigate("/dashboard");
    }
  }, [state]);


  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.title}>The Anonymous Voting App</h1>
      <p className={styles.description}>
      Access Anonymous Voting via Digital Identity with our wallet. 
      </p>
      <i className={styles.description}>
      Choose an option to get started:
      </i>
      
      <div className={styles.buttonGroup}>
        <button 
          className={styles.optionButton}
          onClick={() => navigate("/generate-passphrase")}
        >
          Create New Wallet
          <small className={styles.description}>
            Generate a new 15-word recovery phrase
          </small>
        </button>

        <button 
          className={styles.optionButton}
          onClick={() => navigate("/enter-passphrase")}
        >
          Load Existing Wallet
          <small className={styles.description}>
            Enter your 15-word recovery phrase
          </small>
        </button>
      </div>
    </div>
  );
};

export default Onboarding;