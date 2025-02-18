// src/pages/SettingsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';

import styles from '../styles/Onboarding.module.css';

const SettingsPage = () => {
  const { actions } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.onboardingContainer}>
        <h1 className={styles.title}>Settings</h1>
        <div className={styles.section}>
          <button 
            className={styles.optionButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Wallet pubkey Section */}
        <section className={styles.section}>
          <span className="">Public Key: </span>
          <span className="">{state.wallet.address}</span>
        </section>

      </div>
      <BottomNav />
    </div>
  );
};

export default SettingsPage;