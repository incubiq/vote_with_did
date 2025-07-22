// src/components/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import DetailDialog from './detailDialog';

import styles from '../styles/Base.module.css';

const PreviewQuestionPanel = (props) => {
  const [answers, setAnswers] = useState(null);


  return (
    <>
    
      {props.question? 
        <div className={styles.previewQuestion}>
        <div className={styles.question_descr} >{props.question.rich_text}</div>

        <div className={styles.question_answers} >
          {props.question.type=="bool"? 
            <div>Y / N</div>
          : ""}

          {props.question.type=="select"? 
            <div>one of many</div>
          : ""}

          {props.question.type=="mcq"? 
            <div>several of many</div>
          : ""}
        </div>
      </div>
    : ""}

    </>
  )
};

export default PreviewQuestionPanel;