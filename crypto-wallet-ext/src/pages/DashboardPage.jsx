// src/pages/WalletDashboard.jsx
import React, { useState, useEffect } from 'react'
// import {getConnector} from '@incubiq/siww';
import {siww} from '../utils/siww/siww';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import { async_getIdentusApiKey } from '../utils/encrypt';
import { srv_getDid, srv_getCredsOffers, srv_postAuth, srv_linkWallet } from "../utils/rpc_identity";
import { srv_postWalletType } from "../utils/rpc_settings";
import { getTokenFromCookie } from "../utils/cookies";

import BottomNav from '../components/BottomNav';

import styles from '../styles/Base.module.css';

const _siww=new siww();
const gSIWW=_siww.getConnector("SIWC");

const WalletDashboard = () => {
  const { state, actions } = useWallet();
  const [aAvailWallet, setAAvailWallet] = useState([]);
  const navigate = useNavigate();

  // instanciate the cardano connector
  useEffect( () => {

    // init SIWC
    gSIWW.async_initialize({
      onNotifyAccessibleWallets: function(_aWallet){
        setAAvailWallet(_aWallet);
        _aWallet.forEach((item) => {
          // check if wallet is already registered in the backend
          srv_postWalletType({
            chain: item.chain,
            id: item.id,
            name: item.name,
            logo: item.logo,
            networkId: item.networkId,
          })
          .then(data=> {
          })
          .catch(err => {
          })

          if(item.isEnabled) {
            // connect + get balance of coins / tokens
//            let _api = await window.cardano[idWallet].enable();
          }
        })
      },

      onNotifyConnectedWallet: async(_wallet) => {
        // just enabled a wallet? issue a VC (wallet name, pub key, funds)
        if(_wallet.wallet && _wallet.wallet.isEnabled) {

          const _assets=await gSIWW.async_checkWallet(_wallet.wallet.id);
          if(_assets.didUserAccept && _assets.wallet.hasReplied && _assets.wallet.isEnabled) {
            // ensure VC proof of ownership of the wallet
            srv_linkWallet({
              address: _assets.assets.stakeAddress,
              chain: _wallet.wallet.chain.symbol, 
              networkId: _wallet.wallet.chain.id
            })
          }


          return;
        }
        
      },

      onNotifySignedMessage: function(_wallet){
          return;
      },
    });

  }, []);

  const onConnectWallet = async (_wallet) => {
    try {
      gSIWW.async_connectWallet(_wallet.id);
//      const _api = await window.cardano[_wallet.id].enable();
    }
    catch (err) {
      return;
    }
  }

  const async_getDIDs = async (_apiKey) => {
    srv_getDid(_apiKey)
    .then(data=> {
      actions.identusDiDSet(data.data);
    })
    .catch(err => {
      console.log("Could not access DID from wallet");
    })
  }

  const async_getVCs = async (_apiKey) => {
    srv_getCredsOffers(_apiKey)
    .then(data=> {
      actions.identusVCSet(data.data);
    })
    .catch(err => {
      console.log("Could not access VC offers from wallet");
    })
  }
  // Redirect to home if wallet is not loaded
  React.useEffect(() => {
    if (state.status !== 'ready' || !state.wallet) {
      navigate('/');
    }
    else {

      // ensure we have a cookie for the user (we always to this as the backend could have been reset, and not have kept this user in memory )
      srv_postAuth({
        username: "VotingWallet_"+state.wallet.address.slice(-8),
        seed: state.wallet.seed
      })
      .then(_data => {

        // load the DIDs / VCs
        async_getDIDs();
        async_getVCs();
      })
      .catch(err => {
        console.log("Could not authenticate ");
      })
    }
  }, [state.status, state.wallet]);

  if (state.status !== 'ready' || !state.wallet) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.pageContainer}>
          <div className={styles.container}>

          <h1 className={styles.title}>Wallets</h1>

          {aAvailWallet && aAvailWallet.length>0 ? aAvailWallet.map((item, index) => {
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
          }): 
          
            <div className={styles.section}>
              <p>No wallet detected on this browser</p>
            </div>
            }

        </div>

        <h1 className={styles.title}>Available Ballots</h1>

      <BottomNav />
    </div>
  );
};

export default WalletDashboard;