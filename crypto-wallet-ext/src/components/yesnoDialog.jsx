import React, { useState } from 'react';

import styles from '../styles/Dialogs.module.css';

// Reusable YesNoDialog component
function YesNoDialog({ isOpen, title, message, onYes, onNo }) {
  if (!isOpen) return null;

  return (
    <div className={styles.dialog_overlay}>
        <div 
          className={styles.dialog_content}
        >

        <div className={styles.dialog_header}>
          <h3 className={styles.dialog_title}>{title}</h3>
          <div
            onClick={onNo}
            className={styles.close_button}
          >
            ×
          </div>
        </div>

        <p className={styles.properties_container}>{message}</p>
        
        <div className="">
          <button
            onClick={onNo}
            className={styles.red_btn}
          >
            No
          </button>
          
          <button
            onClick={onYes}
            className={styles.green_btn}
          >
            Yes
          </button>
        </div>

      </div>
    </div>
  );
}

export default YesNoDialog;