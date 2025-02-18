// src/pages/DIDsPage.jsx
import React from 'react';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import styles from '../styles/Onboarding.module.css';

const DIDsPage = () => {
  const { state } = useWallet();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.onboardingContainer}>
        <h1 className={styles.title}>Your DIDs</h1>
        <div className={styles.section}>
          {state.dids.length === 0 ? (
            <p>No DIDs found in your wallet</p>
          ) : (
            <ul className={styles.list}>
              {state.dids.map((did, index) => (
                <li key={index} className={styles.listItem}>
                  <span className={styles.didId}>{did.id}</span>
                  <span className={styles.didMethod}>{did.method}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default DIDsPage;