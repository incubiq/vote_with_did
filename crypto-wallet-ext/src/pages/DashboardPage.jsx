// src/pages/WalletDashboard.jsx
import React, { useState, useEffect } from 'react'
import {getConnector} from '@incubiq/siww';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import { getIdentusApiKey } from '../utils/encrypt';
import { srv_getDid, srv_getCredsOffers } from "../utils/identity";
import BottomNav from '../components/BottomNav';

import styles from '../styles/Base.module.css';

const gSIWW=getConnector("SIWC");

const WalletDashboard = () => {
  const { state, actions } = useWallet();
  const [aAvailWallet, setAAvailWallet] = useState([]);
  const navigate = useNavigate();

  // instanciate the cardano connector
  useEffect(() => {

    // init SIWC
    gSIWW.async_initialize({
      
      onNotifyAccessibleWallets: function(_aWallet){
        setAAvailWallet(_aWallet);
      },

      onNotifyConnectedWallet: function(_wallet){
        // just enabled a wallet? issue a VC (wallet name, pub key, funds)
        if(_wallet.isEnabled) {

        }
        
      },

      onNotifySignedMessage: function(_wallet){
          return;
      },
    });

  }, []);

  const onConnectWallet = (_wallet) => {
    gSIWW.async_connectWallet(_wallet.id);
  }


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
        <h1 className={styles.title}>Wallets</h1>


          {aAvailWallet? aAvailWallet.map((item, index) => {
            return (
              <div 
                key={index} 
                className={styles.wallet}
                onClick = {() => onConnectWallet(item)}
              >
                <img src={item.logo} />
                <div className={styles.title} >{item.name}</div>
                <span className={`${styles.connected} ${item.isEnabled? styles.on: styles.off}`}>{item.isEnabled? "Connected": "click to connect"}</span>
              </div>
            )
          }):""}

        <h1 className={styles.title}>Available Ballots</h1>

      <BottomNav />
    </div>
  );
};

export default WalletDashboard;