// src/pages/WalletDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import { getIdentusApiKey } from '../utils/encrypt';
import { srv_getDid, srv_getCredsOffers } from "../utils/identity";
import BottomNav from '../components/BottomNav';
import DIDPanel from '../components/DIDs';
import VCPanel from '../components/VCs';

import styles from '../styles/Onboarding.module.css';

const WalletDashboard = () => {
  const { state, actions } = useWallet();
  const navigate = useNavigate();

  // Redirect to home if wallet is not loaded
  React.useEffect(() => {
    if (state.status !== 'ready' || !state.wallet) {
      navigate('/');
    }
    else {
      // load the DIDs
      let _apikey=getIdentusApiKey(state.wallet);
      srv_getDid(_apikey)
        .then(data=> {
          actions.identusDiDSet(data.data);
        })
        .catch(err => {
          console.log("Could not access DID from wallet");
        })

      srv_getCredsOffers(_apikey)
        .then(data=> {
          actions.identusVCSet(data.data);
        })
        .catch(err => {
          console.log("Could not access VC offers from wallet");
        })
    }
  }, [state.status, state.wallet]);

  if (state.status !== 'ready' || !state.wallet) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.pageContainer}>
        <h1 className={styles.title}>Digital Identity Wallet</h1>

        <div className={styles.onboardingContainer}>

        {/* DIDs Section */}
        <DIDPanel 
          aItem={state? state.dids: []}
        />

        <VCPanel 
          aItem={state? state.vcs: []}
        />

      </div>
      <BottomNav />
    </div>
  );
};

export default WalletDashboard;