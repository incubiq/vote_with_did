// src/pages/SettingsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';

import styles from '../styles/Onboarding.module.css';
import stylesC from '../styles/Creds.module.css';

const SettingsPage = () => {
  const { state, actions } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.resetWallet();
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>Settings</h1>
        <div className={styles.onboardingContainer}>
        <div className={styles.section}>
          <button 
            className={styles.optionButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Wallet pubkey Section */}
        {state.wallet?
        <section className={stylesC.section}>
          <h3 className={stylesC.pin}>Public Key</h3>
          <span className={stylesC.didUrl}>{state.wallet.address}</span>
        </section>
        :""}

      </div>
      <BottomNav />
    </div>
  );
};

export default SettingsPage;