// src/components/BottomNav.jsx
import React from 'react';

import styles from '../styles/Creds.module.css';

const DIDPanel = (props) => {
  
  const renderDid = (_did, _index)=> {
    return (
      <li key={_index} className={styles.listIDs}>
        {/* Customize based on your DID structure */}
        <img className={styles.idImage} src="/images/id-badge.jpg" />
        <div className={styles.insideImage}>
          <span className={styles.didUrl}>{_did.did}</span>
          <span className={styles.pin_id}>{_did.status}</span>
        </div>
      </li>
    )
  }

  return (
    <div>
      {props.aItem==null || props.aItem.length === 0 ? (
        <p>No DIDs found in your wallet</p>
      ) : (
        <ul className={styles.list}>
          {props.aItem.map((did, index) => (
            renderDid(did, index)
          ))}
        </ul>
      )}
    </div>
  )
};

export default DIDPanel;