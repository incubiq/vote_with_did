// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import {  srv_postVote, srv_canVote } from '../utils/rpc_ballot.js';

import styles from '../styles/Base.module.css';
import stylesDialog from '../styles/Dialogs.module.css';
import stylesVoting from '../styles/Voting.module.css';

const ResultsPanel = (props) => {


  return (
    <div >
      <div className={`${stylesDialog.dialog_overlay} ${props.isVisible? "" : styles.hidden} `}>
          <div 
            className={stylesDialog.dialog_content}
          >
            {props.results?
            <div>
              <p># votes: {props.results.totalVotes}</p>
              <p># invalid votes: {props.results.invalidVotes}</p>

                -------
              {props.results.tallyResults.map((q, iq) => (
                <div key = {iq}>
                <b > {q.title}</b>
                {Object.entries(q.choices).map((c, ic) => (
                    <div key = {ic}>
                      <div>{c[1].text} : {c[1].count}</div>
                    </div>
                ))}
                </div>
              ))}
            </div>
            :""}
          <button
                  onClick={props.onClose}
                  className={`${stylesDialog.green_red} ${stylesDialog.right} `}
                  >
                        Close
            </button>
        </div>
      </div>
			<ToastContainer />

    </div>
  )
};

export default ResultsPanel;