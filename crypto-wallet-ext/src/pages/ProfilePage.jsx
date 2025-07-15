// src/pages/ProfilePage.jsx
import React from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import BottomNav from '../components/BottomNav';
import DIDPanel from '../components/DIDs';
import PropValControl from '../components/propvalControl';
import { srv_postAccessRight } from '../utils/rpc_identity';
import { srv_getBallots } from '../utils/rpc_ballot';

import styles from '../styles/Base.module.css';
import stylesC from '../styles/Creds.module.css';

const ProfilePage = () => {
  const { state, actions } = useWallet();
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.resetWallet();
    navigate('/');
  };

  const onUpdateAuthorization = async (_profile) => {
    srv_postAccessRight({
      authorization: _profile
    })
    .then(_data => {
      if(_data.data==null) {
        throw _data
      }
      toast.success ("Your access level was changed to "+_profile)
      actions.authorizationSet(_profile);

      if(_profile=="Admin") {
        srv_getBallots()
          .then(_data => {
            actions.ballotsSet(_data.data);
          })
          .catch(err => {
            toast.error("Could not load all ballots ("+err.message+")");
          })        
      }
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
          options = {["Voter", "Designer", "Admin"]}
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