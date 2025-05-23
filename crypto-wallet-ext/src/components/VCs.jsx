// src/components/BottomNav.jsx
import React from 'react';

import styles from '../styles/Creds.module.css';

const VCPanel = (props) => {

  const renderProofOrOffer = (_proof, _index) => {
    return (
      <li key={_index} className={styles.listCreds}>
        {_proof.protocolState=="CredentialReceived"? 
        <>
          <p className={styles.date}>{new Date(_proof.createdAt).toLocaleDateString()}</p>
          <img className={styles.credsImage} src="/images/creds.png" />
          <div className={styles.pin_proof}>Proof Received</div>
          <p className={styles.proof_content}>{_proof.claims.title? _proof.claims.title: "Uknown proof"}</p>
        </>
        : 
        <>
          <p className={styles.date}>{new Date(_proof.createdAt).toLocaleDateString()}</p>
          <div className={styles.pin_offer}>Offer pending</div>
          <p className={styles.proof_content}>Awaiting Validation...</p>
        </>}
      </li>
    )
  }

  return (
    <div>
      {props.aItem==null || props.aItem.length === 0 ? (
        <p>No Verifiable Credentials found in your wallet</p>
      ) : (
        <ul className={styles.list}>
          {props.aItem.map((vc, index) => (
              renderProofOrOffer(vc, index)
          ))}
        </ul>
      )}
    </div>
  )
};

export default VCPanel;