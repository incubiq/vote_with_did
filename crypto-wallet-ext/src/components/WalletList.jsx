// src/components/WalletList.jsx
import React from 'react';
import styles from '../styles/Base.module.css';

const WalletList = ({ wallets, onConnectWallet, connecting }) => {
  if (!wallets || wallets.length === 0) {
    return (
      <div className={styles.section}>
        <p>No wallet detected on this browser</p>
      </div>
    );
  }

  return (
    <>
      {wallets.map((wallet, index) => (
        <div 
          key={index} 
          className={styles.wallet}
          onClick={() => onConnectWallet(wallet)}
        >
          <img src={wallet.logo} alt={wallet.name} />
          <div className={styles.title}>{wallet.name}</div>
          <span className={`${styles.connected} ${wallet.isEnabled ? styles.on : styles.off}`}>
            {connecting ? "Connecting..." : wallet.isEnabled ? "Connected" : "click to connect"}
          </span>
        </div>
      ))}
    </>
  );
};

export default WalletList;