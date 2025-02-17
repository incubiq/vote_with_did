// src/pages/Onboard_Main.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from '../styles/Onboarding.module.css';

const Onboarding = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.onboardingContainer}>
      <h1 className={styles.title}>Digital Identity Wallet</h1>
      <p className={styles.description}>
        Secure and manage your digital identity with our wallet. Choose an option to get started:
      </p>
      
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