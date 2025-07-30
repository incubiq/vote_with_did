// src/pages/VCsPage.jsx
import React from 'react';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import VCPanel from '../components/VCs';

import styles from '../styles/Base.module.css';

const VCsPage = () => {
  const { state } = useWallet();

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>My Credentials</h1>
        <div className={styles.container}>

          <VCPanel 
            aItem={state? state.vcs: []}
          />

        <BottomNav />
      </div>
    </div>
  );
};

export default VCsPage;