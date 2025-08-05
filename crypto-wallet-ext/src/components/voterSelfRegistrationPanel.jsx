// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useRequirements } from '../state/SettingsContext';

import styles from '../styles/Base.module.css';
import stylesDialog from '../styles/Dialogs.module.css';
import stylesVoting from '../styles/Voting.module.css';

const VoterSelfRegistrationPanel = (props) => {
  const [aRequirement, setARequirement] = useState([]);
  const [iRequirement, setIRequirement] = useState(0);
  const [aCertif, setACertif] = useState([]);
  const { state, actions } = useRequirements();
  const aAllRequirements = actions.getRequirements();

  useEffect(() => {
    if(props.ballot && props.ballot.aCreds) {
      setARequirement(props.ballot?.aCreds);
    }
  }, [props.ballot]);

  const async_selfRegister = async (_data)=> {
    // TODO

    toast.success("Your certificate for allowing you to vote was issued");
    props.onHasSelfRegistered(_data);
    props.onClose();
  }

  const renderCertificateIssuancePanel = ()=> {
    return (
      <div className={stylesVoting.dialog_requirements}>
        {aRequirement.map((req, iReq) => (
          <div key={iReq} className={` ${styles.inline} ${stylesDialog.property_row} ${stylesVoting.dialog_choices} `} >              
          {actions.getRequirementInClear(req.type)?
          <>
              <div className={` ${styles.bold_underlined} `}>
                {actions.getRequirementInClear(req.type)}
              </div>

              <button
                onClick={(_data) => async_selfRegister(_data)}
                className={`${stylesDialog.green_btn} `}
              >
                Request certificate
              </button>
          </>
          :""}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div >
      <div className={`${stylesDialog.dialog_overlay} ${props.isVisible? "" : styles.hidden} `}>
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