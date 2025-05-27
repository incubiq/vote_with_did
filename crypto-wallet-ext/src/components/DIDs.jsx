// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import DetailDialog from './detailDialog';

import styles from '../styles/Creds.module.css';

const DIDPanel = (props) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle opening dialog
  const openDialog = () => {
    setIsDialogOpen(true);
  };

  // Handle closing dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
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
  
  const renderDid = (_did, _index)=> {
    return (
      <li key={_index} className={styles.listIDs} onClick={() => openDialog()}>
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

      {/* Dialog overlay */}
      <DetailDialog 
        item = {{
          did: props.aItem[0].did,
          status: props.aItem[0].status,
        }}
        isOpen = {isDialogOpen}
        onClose = {closeDialog}
      />

    </div>
  )
};

export default DIDPanel;