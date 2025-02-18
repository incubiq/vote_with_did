// src/pages/VCsPage.jsx
import React from 'react';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import styles from '../styles/Onboarding.module.css';

const VCsPage = () => {
  const { state } = useWallet();

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>Your Credentials</h1>
        <div className={styles.onboardingContainer}>
        <div className={styles.section}>
          {state.vcs.length === 0 ? (
            <p>No Verifiable Credentials found in your wallet</p>
          ) : (
            <ul className={styles.list}>
              {state.vcs.map((vc, index) => (
                <li key={index} className={styles.listItem}>
                  <h3>{vc.type}</h3>
                  <p>Issuer: {vc.issuer}</p>
                  <p>Issued Date: {new Date(vc.issuanceDate).toLocaleDateString()}</p>
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

export default VCsPage;