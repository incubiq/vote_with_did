// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import {  srv_postVote, srv_canVote } from '../utils/rpc_ballot.js';

import styles from '../styles/Base.module.css';
import stylesDialog from '../styles/Dialogs.module.css';
import stylesVoting from '../styles/Voting.module.css';

const VotingPanel = (props) => {
  const [question, setQuestion] = useState(props.ballot?.aQuestionInFull?.length>0? props.ballot?.aQuestionInFull[0]: null);
  const [iQuestion, setIQuestion] = useState(0);
  const [canVote, setCanVote] = useState(false);
  const [hasVoted, sethasVoted] = useState(false);
  const [showRequirement, setShowRequirement] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [aEligibleThid, setAEligibleThid] = useState([]);

  useEffect(() => {
    setQuestion(props.ballot?.aQuestionInFull[iQuestion]);
    // add default choice if none exist
    if(answers[iQuestion]==undefined && props.ballot) {
      let _a=[...answers];
      _a[iQuestion]=props.ballot?.aQuestionInFull[iQuestion].aChoice[0].value;
      setAnswers(_a);
    }
  }, [iQuestion, props.ballot]);

  useEffect(() => {
    if(props.ballot) {
      srv_canVote(props.ballot.uid, aEligibleThid)
      .then(dataCanVote => {
        setCanVote(dataCanVote.data.canVote);
        sethasVoted(dataCanVote.data.hasVoted);
      })
      .catch((err) => {})
    }
  }, [props.ballot, aEligibleThid]);
  
  useEffect(() => {
    if(props?.aVC_eligibility?.length>0) {
      let _aRet=[];
      props.aVC_eligibility.forEach(item => {
        _aRet.push(item.thid);
      })
      setAEligibleThid(_aRet);
    }
  }, [props.aVC_eligibility]);

  // start at question 0 
  useEffect(() => {
    if(props.isVisible) {
      setIQuestion(0);
      setShowRequirement(true);
    }
  }, [props.isVisible]);

  const resetAnswer = (_value) => {
    let _aA=[...answers];
    _aA[iQuestion] = _value;
    setAnswers(_aA);

    // bubble up
    if(props.setChoice) {
      props.setChoice(iQuestion, _value);
    }
  }

  const async_vote = async ( )=> {
    // vote on chain
    srv_postVote(props.ballot.uid, aEligibleThid, answers, null)
    .then((dataVoted) => {
      if(!dataVoted.data) {throw dataVoted}
      toast.success("Your vote was successfully and anonymously cast");
      props.onHasVoted(answers);
      props.onClose();
    })
    .catch((err) => {
      toast.error("Vote not cast ("+err.message+")");
    })
    // TODO
  }

  const renderUpToThreeChoices = (_q) => {
    return (
      <div>
        {_q.aChoice.map((choice, iChoice) => (
          <div key={iChoice} className={stylesVoting.radio}>
            <input  
              className={stylesVoting.radio_control} 
              type="radio" 
              id={_q.uid+"_c"+iChoice} 
              name={_q.uid+"_c"+iChoice} 
              value={answers[iQuestion]} 
              checked={choice.value === answers[iQuestion]} 
              onChange={(e) => resetAnswer(choice.value)} />
            <label className={stylesVoting.radio_text} for={_q.uid+"_c"+iChoice}>{choice.text}</label>
          </div>
        ))}
      </div>
    )
  }

  const renderSelect = (_q) => {
    return (
      <div>
        {_q.aChoice.length> 3? 
              <select className={styles.select} 
                onChange={(e) => resetAnswer(e.target.value)}
              >
                  {_q.aChoice.map((choice, iChoice) => (
											<option 
                        key={iChoice} 
                        value = {choice.value}
                      >{choice.text}</option>
										))}
              </select>
              : 
              <div>
                {renderUpToThreeChoices(_q)}
              </div>
            }
      </div>
    )
  }

  const renderMCQ = (_q) => {
    return (
      <div>
        {_q.aChoice.map((choice, iChoice) => (
          <div key={iChoice}>
            <input  type="checkbox" 
            id={_q.uid+"_c"+iChoice} 
            name={_q.uid+"_c"+iChoice} 
            value={answers[iQuestion][iChoice]} 
            checked={answers[iQuestion][iChoice]} 
            onChange={(e) => {
                if(e.target.checked) {
                  resetAnswer([...answers, choice.value])
                }
                else {
                  resetAnswer(answers.filter(v => v !== option.value));
                }
              }
            } />
            <label for={_q.uid+"_c"+iChoice}>{choice.text}</label>
          </div>
        ))}
      </div>
    )
  }

  const renderVotingPanel = (_q)=> {
    return (
      <div className={stylesVoting.dialog_ballot}>
        {_q?
        <>
          <div className={stylesDialog.dialog_header}>
              <h3 className={stylesDialog.dialog_title}>{_q.title}</h3>
              <div
                onClick={props.onClose}
                className={stylesDialog.close_button}
              >
                ×
              </div>
          </div>
    

          <div className={stylesVoting.dialog_question}>
            <div className={stylesDialog.properties_container}><div dangerouslySetInnerHTML={{ __html: _q.rich_text }} /></div>
          </div>

          <div className={stylesVoting.dialog_choices}>
            {_q.type=="bool"? renderUpToThreeChoices(_q): ""}
            {_q.type=="select"? renderSelect(_q): ""}
            {_q.type=="mcq"? renderMCQ(_q): ""}
          </div>
        </>
        :""}        
      </div>
    )
  }

  const renderVotingRequirements = ( ) => {
    return (
      <div className={stylesVoting.dialog_ballot}>
          <div className={stylesDialog.dialog_header}>
              <h3 className={stylesDialog.dialog_title}>Requirements</h3>
              <div
                onClick={props.onClose}
                className={stylesDialog.close_button}
              >
                ×
              </div>
          </div>
          {hasVoted? 
            <div>🗳️ You have already cast your vote on this ballot</div>
          : 
          canVote? 
            <div>You are eligible to vote on this ballot</div>
          : 
          <>
            <div>You do not fulfill requirements for voting eligibility</div>
            {props.ballot.aCreds.map((aCred, iCred) => (
              <div key={iCred}> {aCred["type"]} </div>
            ))}
          </>
          }
      </div>
    )    
  }

  return (
    <div >
      <div className={`${stylesDialog.dialog_overlay} ${props.isVisible? "" : styles.hidden} `}>
          <div 
            className={stylesDialog.dialog_content}
          >
  
          {props.ballot && !showRequirement? renderVotingPanel(props?.ballot?.aQuestionInFull[iQuestion]): ""}
          {showRequirement? renderVotingRequirements(): ""}
          
          <div className="">
            <button
              onClick={( )=> {
                if(iQuestion>0) {
                  setIQuestion(iQuestion-1)
                }
                else {
                    setShowRequirement(true);
                }
              }}
              className={`${stylesDialog.blue_btn} ${stylesDialog.left} ${showRequirement? styles.hidden: ""}`}
            >
              &lt;&lt; Prev
            </button>
            

            <button
              onClick={( )=> {
                if(iQuestion<=props?.ballot?.aQuestionInFull.length-1) {
                  if(showRequirement) {
                    setShowRequirement(false);
                  }
                  else {  
                    setIQuestion(iQuestion+1)                
                  }
                }
              }}
              className={`${stylesDialog.blue_btn} ${stylesDialog.right} ${showRequirement==false && iQuestion==props?.ballot?.aQuestionInFull.length-1 || !canVote? styles.hidden: ""}`}
            >
              Next &gt; &gt; 
            </button>

            <button
              onClick={( )=> {
                props.onClose()
              }}
              className={`${stylesDialog.red_btn} ${stylesDialog.right} ${canVote? styles.hidden: ""}`}
            >
              Close 
            </button>

            <button
              onClick={(_data) => async_vote(_data)}
              className={`${stylesDialog.green_btn} ${stylesDialog.right} ${showRequirement==false && iQuestion==props?.ballot?.aQuestionInFull.length-1? "": styles.hidden} `}
            >
              Cast Vote
            </button>

          </div>
  
        </div>
      </div>
			<ToastContainer />

    </div>
  )
};

export default VotingPanel;