// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import DetailDialog from './detailDialog';

import styles from '../styles/Base.module.css';

const PreviewQuestionPanel = (props) => {
  const [answers, setAnswers] = useState(props.question?.aChoice?.length>0? [props.question.aChoice[0].value]: []);

  const resetAnswer = (_value) => {
    setAnswers([_value]);

    // bubble up
    if(props.setChoice) {
      props.setChoice([_value]);
    }
  }

  return (
    <>
    
      {props.question? 
        <div className={styles.previewQuestion}>
        <div className={styles.question_descr} >{props.question.rich_text}</div>

        <div className={styles.question_answers} >

          {props.question.aChoice.length==0? 
              <span className={styles.italic}>in progress</span>
          :
          <>
            {props.question.type=="select" || props.question.type=="bool"? 
            <>
            {props.question.aChoice.length> 3? 
              <select className={styles.select} onChange={(e) => resetAnswer(e.target.value)}>
                  {props.question.aChoice.map((choice, iChoice) => (
											<option value = {choice.value}>{choice.text}</option>
										))}
              </select>
              : 
              <div>
                {props.question.aChoice.map((choice, iChoice) => (
                  <>
                    <input type="radio" id={choice.value} name={choice.value} value={choice.value} checked={iChoice === 0} onChange={(e) => resetAnswer(e.target.value)} />
                    <label for={choice.value}>{choice.text}</label>
                  </>
                ))}
              </div>
            }
            </>
            : ""}

            {props.question.type=="mcq"? 
              <div>
                {props.question.aChoice.map((choice, iChoice) => (
                  <>
                    <input type="checkbox" id={choice.value} name={choice.value} value={choice.value} checked={iChoice === 0} 
                    onChange={(e) => {
                        if(e.target.checked) {
                          resetAnswer([...answers, choice.value])
                        }
                        else {
                          resetAnswer(answers.filter(v => v !== option.value));
                        }
                      }
                    } />
                    <label for={choice.value}>{choice.text}</label>
                  </>
                ))}
              </div>
            : ""}
          </>}

        </div>
      </div>
    : ""}

    </>
  )
};

export default PreviewQuestionPanel;