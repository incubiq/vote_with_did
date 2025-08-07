// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import DetailDialog from './detailDialog';

import styles from '../styles/Creds.module.css';

const VCPanel = (props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);

  const renderProofOrOffer = (_proof, _index) => {
    const _strDateTo = _proof.claims.expire_at? new Date(_proof.claims.expire_at).toLocaleDateString() : new Date(_proof.createdAt).toLocaleDateString();
    return (
      <li key={_index} className={styles.listCreds} onClick={() => openDialog(_proof)}>
        <>
          <p className={styles.date}>valid until {_strDateTo}</p>
          <img className={styles.credsImage} src="/images/creds.png" />
          <div className={styles.pin_proof}>Proof Received</div>

          {_proof.claims.claim_type == "address_ownership"?   <img src="/images/wallet_ownership.png" width="64px" height="64px" /> :
          _proof.claims.claim_type == "proof_of_fund"?   <img src="/images/proof_of_fund.png" width="64px" height="64px" /> :
          _proof.claims.claim_type == "proof_of_min"?   <img src="/images/proof_of_min.png" width="64px" height="64px" /> :
          <div>"Unknown type"</div>
          }

        </>
      </li>
    )
  }

  // Handle opening dialog
  const openDialog = (_proof) => {
    setSelectedProof(_proof.claims);
    setIsDialogOpen(true);
  };

  // Handle closing dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedProof(null);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isDialogOpen) {
        closeDialog();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isDialogOpen]);

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

      {/* Dialog overlay */}
      <DetailDialog 
        item = {selectedProof? selectedProof : {}}
        isOpen = {isDialogOpen}
        onClose = {closeDialog}
      />

    </div>
  )
};

export default VCPanel;