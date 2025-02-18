// src/components/BottomNav.jsx
import React from 'react';

import styles from '../styles/Creds.module.css';

const VCPanel = (props) => {

  const renderProofOrOffer = (_proof, _index) => {
    return (
      <li key={_index} className={styles.listItem}>
        {_proof.protocolState=="CredentialReceived"? 
        <>
          <h3 className={styles.pin}>{_proof.protocolState}</h3>
          <p>Issued Date: {new Date(_proof.createdAt).toLocaleDateString()}</p>
          <p>{_proof.claims.title? _proof.claims.title: "Uknown proof"}</p>
        </>
        : 
        <>
          <h3 className={styles.pin_orange}>{_proof.protocolState}</h3>
          <p>Issued Date: {new Date(_proof.createdAt).toLocaleDateString()}</p>
        </>}
      </li>
    )
  }

  return (
    <section className={styles.section}>
       <h2>Credentials</h2>
      {props.aItem==null || props.aItem.length === 0 ? (
        <p>No Verifiable Credentials found in your wallet</p>
      ) : (
        <ul className={styles.list}>
          {props.aItem.map((vc, index) => (
              renderProofOrOffer(vc, index)
          ))}
        </ul>
      )}
    </section>
  )
};

export default VCPanel;