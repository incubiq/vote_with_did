// src/pages/VotesPage.jsx
import React from 'react';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import styles from '../styles/Base.module.css';

const VotesPage = () => {
  const { state } = useWallet();

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>Your Votes</h1>
        <div className={styles.container}>
        <div className={styles.section}>
          {state.ballots.length === 0 ? (
            <p>No ballot found</p>
          ) : (
            <ul className={styles.list}>
              {state.ballots.map((did, index) => (
                <li key={index} className={styles.listItem}>
                  <span className={styles.property}>prop</span>
                  <span className={styles.value}>val</span>
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

export default VotesPage;