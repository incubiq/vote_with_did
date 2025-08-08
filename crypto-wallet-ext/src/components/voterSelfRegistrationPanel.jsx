// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useRequirements } from '../state/SettingsContext';
import { useWallet } from '../state/WalletContext';
import { useWalletBackend } from '../hooks/useWalletBackend';

import styles from '../styles/Base.module.css';
import stylesDialog from '../styles/Dialogs.module.css';
import stylesVoting from '../styles/Voting.module.css';

const VoterSelfRegistrationPanel = (props) => {
  const [aRequirement, setARequirement] = useState([]);
  const [iRequirement, setIRequirement] = useState(0);
  const [aCertif, setACertif] = useState([]);
  const [selProofOfOwnership, setSelProofOfOwnership] = useState(null);
  const { state, actions } = useRequirements();
  const aAllRequirements = actions.getRequirements();

  const {
      linkMinBalance
    } = useWalletBackend();

  useEffect(() => {
    if(props.ballot && props.ballot.aCreds) {
      setARequirement(props.ballot?.aCreds);
    }
  }, [props.ballot]);

  useEffect(() => {
    if (props.aVC_ownership?.length > 0) {
      setSelProofOfOwnership(props.aVC_ownership[0]); 
    }
  }, [props.aVC_ownership]);

  const async_selfRegister = async ()=> {
    // TODO

    if(!selProofOfOwnership) {
      toast.success("Could not find proof of ownership certificate to issue your proof of minimum balance");
      return;
    }

    linkMinBalance({
        address: selProofOfOwnership.claims.address,
        chain: selProofOfOwnership.claims.chain,
        networkId: selProofOfOwnership.claims.networkId,
        minimum: aRequirement[iRequirement].extra["minimum balance"],
        uid_ballot: props.ballot.uid
      })
      .then(_data => {
        if(!_data.data) {throw _data}
        props.onHasSelfRegistered(_data);
        toast.success("Your certificate for allowing you to vote was issued");
      })
      .catch(err => {
        toast.error("Could not produce certificate "+"("+err.message+")");
      })

    toast.success("Your certificate will be issued in a moment...");
    props.onClose();
  }

  const renderCertificateIssuancePanel = ()=> {
    return (
      <div className={` ${stylesVoting.dialog_requirements} ${stylesDialog.property_row} ${stylesVoting.dialog_choices}`}>
        {aRequirement.map((req, iReq) => (
          <div key={iReq} className={` ${styles.inline}  `} >              
          {actions.getRequirementInClear(req.type)?
          <>
            <div className={styles.halfWidth}>              
                <div className={` ${styles.bold_underlined} `}>
                  {actions.getRequirementInClear(req.type)}
                </div>

                {req.extra?
                  <div>
                    {req.extra.blockchain? <div className={styles.smaller}>Chain: {req.extra.blockchain} </div>: ""}
                    {req.extra.coin? <div className={styles.smaller}>Coin: {req.extra.coin} </div>: ""}
                    {req.extra["minimum balance"]? <div className={styles.smaller}>Minimum balance: {req.extra["minimum balance"]} </div>: ""}
                  </div>
                :""}
            </div>
            <div className={styles.halfWidth}>
              <div className={styles.smaller}>
                Issue Certificate from 
              </div>
              {props.aVC_ownership && props.aVC_ownership.length>0?
              <select className={stylesVoting.comboCerts}
                onClick={(e) => {setSelProofOfOwnership(props.aVC_ownership[parseInt(e.target.value)])}}
              >
                {props.aVC_ownership.map((vc, iVC) => (
                  <option key={iVC} value={iVC}>
                    {vc.claims.chain + " - "+ vc.claims.address.substring(0,16) +"..."}
                  </option>
                ))}
              </select>
              :""}
              
              <button
                onClick={(_data) => {
                  setIRequirement(iReq);
                  async_selfRegister();
                }}
                className={`${stylesDialog.green_btn} `}
              >
                Request certificate
              </button>
            </div>

          </>
          :""}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div >
      <div className={`  ${stylesDialog.dialog_overlay} ${props.isVisible? "" : styles.hidden} `}>
          <div 
            className={stylesDialog.dialog_content}
          >
    
          <div className={stylesDialog.dialog_header}>
            <h3>Requirements</h3>
            <div
              onClick={props.onClose}
              className={stylesDialog.close_button}
            >
              ×
            </div>
          </div>

            <p>You must satisfy those requirements to be allowed to vote</p>
            {props.ballot? renderCertificateIssuancePanel(): null}
            
            <div className="">             

              <button
                onClick={props.onClose}
                className={`${stylesDialog.red_btn} ${stylesDialog.right} `}
              >
                Close
              </button>


            </div>
    
          </div>
      </div>
			<ToastContainer />

    </div>
  )
};

export default VoterSelfRegistrationPanel;