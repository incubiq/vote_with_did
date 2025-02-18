// src/pages/VCsPage.jsx
import React from 'react';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import DIDPanel from '../components/DIDs';
import VCPanel from '../components/VCs';

import styles from '../styles/Onboarding.module.css';

const VCsPage = () => {
  const { state } = useWallet();

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>Your Credentials</h1>
        <div className={styles.onboardingContainer}>

          <DIDPanel 
            aItem={state? state.dids: []}
          />

          <VCPanel 
            aItem={state? state.vcs: []}
          />

        <BottomNav />
      </div>
    </div>
  );
};

export default VCsPage;