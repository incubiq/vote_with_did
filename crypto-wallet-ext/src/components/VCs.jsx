// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import DetailDialog from './detailDialog';
import { useRequirements } from '../state/SettingsContext.jsx';

import styles from '../styles/Creds.module.css';

const VCPanel = (props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState(null);
  const [filterByTypeOfProof, setFilterByTypeOfProof] = useState(null);

  const { state, actions } = useRequirements();
  const aAllRequirements = actions.getRequirements();

  const renderProofOrOffer = (_proof, _index) => {
    const _strDateTo = _proof.claims.expire_at? new Date(_proof.claims.expire_at).toLocaleDateString() : null;
    if(_proof.claim_type == filterByTypeOfProof || filterByTypeOfProof == "none") {
      return (
        <li key={_index} className={styles.listCreds} onClick={() => openDialog(_proof)}>
          <>
            {_strDateTo? 
              <p className={styles.date}>valid until {_strDateTo }</p>
              : 
            <div> 
                <br /><br />
            </div>}
            <img className={styles.credsImage} src="/images/creds.png" />
            <div className={styles.pin_proof}>Proof Received</div>

            {_proof.claims.claim_type == "address_ownership"?   <img src="/images/wallet_ownership.png" width="64px" height="64px" /> :
            _proof.claims.claim_type == "proof_of_fund"?   <img src="/images/proof_of_fund.png" width="64px" height="64px" /> :
            _proof.claims.claim_type == "proof_of_min"?   <img src="/images/proof_of_min.png" width="64px" height="64px" /> :
            _proof.claims.claim_type == "proof_of_vote"?   <img src="/images/proof_of_vote.png" width="64px" height="64px" /> :
            <div>"Unknown type"</div>
            }

          </>
        </li>
      )
    }
    return  <li key={_index}></li>
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
      <label>Filter by </label>
      <select onChange = {(e)=> {setFilterByTypeOfProof(e.target.value)}}>
        {aAllRequirements.map((req, index) => (
              <option value={req.value}>{req.text}</option>
          ))}
      </select>
      <br />
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