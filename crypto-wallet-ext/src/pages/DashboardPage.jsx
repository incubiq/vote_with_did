// src/pages/WalletDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import styles from '../styles/Onboarding.module.css';

const WalletDashboard = () => {
  const { state, actions } = useWallet();
  const navigate = useNavigate();

  // Redirect to home if wallet is not loaded
  React.useEffect(() => {
    if (state.status !== 'ready' || !state.wallet) {
      navigate('/');
    }
  }, [state.status, state.wallet]);

  const handleLogout = () => {
    actions.resetWallet();
    navigate('/');
  };

  if (state.status !== 'ready' || !state.wallet) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.onboardingContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Digital Identity Wallet</h1>
          <button 
            className={styles.optionButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>


        {/* DIDs Section */}
        <section className={styles.section}>
          <h2>Decentralized Identifiers (DIDs)</h2>
          {state.dids.length === 0 ? (
            <p>No DIDs found in your wallet</p>
          ) : (
            <ul className={styles.list}>
              {state.dids.map((did, index) => (
                <li key={index} className={styles.listItem}>
                  {/* Customize based on your DID structure */}
                  <span className={styles.didId}>{did.id}</span>
                  <span className={styles.didMethod}>{did.method}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* VCs Section */}
        <section className={styles.section}>
          <h2>Verifiable Credentials (VCs)</h2>
          {state.vcs.length === 0 ? (
            <p>No Verifiable Credentials found in your wallet</p>
          ) : (
            <ul className={styles.list}>
              {state.vcs.map((vc, index) => (
                <li key={index} className={styles.listItem}>
                  {/* Customize based on your VC structure */}
                  <h3>{vc.type}</h3>
                  <p>Issuer: {vc.issuer}</p>
                  <p>Issued Date: {new Date(vc.issuanceDate).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
};

export default WalletDashboard;