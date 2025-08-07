// src/pages/ProfilePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import DIDPanel from '../components/DIDs';
import PropValControl from '../components/propvalControl';
import { storage } from '../utils/storage';

import styles from '../styles/Base.module.css';
import stylesC from '../styles/Creds.module.css';

const ProfilePage = () => {
  const { state, actions } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.resetWallet();
    navigate('/');
  };

  const async_changeProfile = async(_profile) => {
    try {
      actions.authorizationSet(_profile);   // will set profile auth to backend and reload Ballots
      const objPr = await storage.async_saveProfile(_profile);
      return _profile;
    }
    catch (err) {
      return null;
    }
  }

  const onUpdateAuthorization = async (_profile) => {
    if(!_profile || _profile==state.authorization) {return null}
    _profile=_profile.toLowerCase();
    async_changeProfile(_profile)
    .then(_user => {
      if(_user==null) {
        throw null;
      }

      toast.success ("Your access level was changed to "+_profile)
    })
    .catch (err => {
      toast.error ("Could not updgrade your access level")
    })
  }

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>Profile</h1>
        <div className={styles.container}>

        <DIDPanel 
            aItem={state? state.dids: []}
        />

        <br />
        
        {state.wallet?        
        <PropValControl 
          property = "Public key"
          value = {state.wallet.address}
          hasCopy = {true}
        />
        :""}

        <PropValControl 
          property = "Access level"
          value = {state.authorization}
          canEdit = {true}
          title = "Choose your access level"
          type = "select"
          options = {["voter", "designer", "admin"]}
          onUpdate = {onUpdateAuthorization}
        />

        <br />  

        <button 
          className={styles.optionButton}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <BottomNav />
      <ToastContainer />
    </div>
  );
};

export default ProfilePage;