// src/components/BottomNav.jsx
import React from 'react';

import styles from '../styles/Creds.module.css';

const DIDPanel = (props) => {
  
  const renderDid = (_did, _index)=> {
    return (
      <li key={_index} className={styles.listItem}>
        {/* Customize based on your DID structure */}
        <span className={styles.didUrl}>{_did.did}</span>
        <span className={styles.pin}>{_did.status}</span>
      </li>
    )
  }

  return (
    <section className={styles.section}>
      <h2>Digital Identities</h2>
      {props.aItem==null || props.aItem.length === 0 ? (
        <p>No DIDs found in your wallet</p>
      ) : (
        <ul className={styles.list}>
          {props.aItem.map((did, index) => (
            renderDid(did, index)
          ))}
        </ul>
      )}
    </section>
  )
};

export default DIDPanel;