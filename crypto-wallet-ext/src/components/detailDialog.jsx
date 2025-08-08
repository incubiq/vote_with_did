// src/components/detailDialog.jsx
import React, { useState, useEffect } from 'react';

import styles from '../styles/Dialogs.module.css';

const DetailDialog = (props) => {

  // Handle ESC key press
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && props.isOpen) {
        props.onclose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const renderNice = (_text) => {
    // bool?
    if(_text===true) {return "true"}
    if(_text===false) {return "false"}

    // number ? 
    if(!isNaN(_text) && !isNaN(parseFloat(_text))) {
      return _text;
    }

    // empty array ? 
    if(Array.isArray(_text) ) {
      if(_text.length==0) {return "none"}
    }

    // date?
    if(typeof _text === "string") {
      const date = new Date(_text);
      if(!isNaN(date.getTime())) {
        const formatted = new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(date);

        return formatted;
      }
    }

    // text?
    if(_text.length>20) {
      return _text.substring(0,8) + "..."+_text.substring(_text.length, _text.length-8);
    }
    return _text;
  }

  const renderDialog = () => {
    if(props.isOpen==false) {
      return (<></>)
    }
    return (
      <div 
        className={styles.dialog_overlay}
        onClick={props.onClose}
      >
        <div 
          className={styles.dialog_content}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dialog header */}
          <div className={styles.dialog_header}>
            <h3 className={styles.dialog_title}>Details</h3>
            <div
              onClick={props.onClose}
              className={styles.close_button}
            >
              ×
            </div>
          </div>

          {/* Dialog content - Object properties */}
            <div className={styles.properties_container}>
              {Object.entries(props.item).map(([key, value]) => (
                 <div key={key} className={styles.property_row}>
                 <span className={styles.property_key}>
                   {key.replace(/([A-Z])/g, ' $1').trim()}:
                 </span>
                 <span className={styles.property_value}>
                   {typeof value === 'object' && value !== null && value.length!=0? (
                     <div className="text-right">
                       {Object.entries(value).map(([nestedKey, nestedValue]) => (
                         <div key={nestedKey} className={styles.property_key}>
                           <span className={styles.property_value}>{nestedKey}:</span> {renderNice(nestedValue)}
                         </div>
                       ))}
                     </div>
                   ) : (
                    renderNice(value)
                   )}
                 </span>
               </div>
              ))}
            </div>


          {/* Dialog footer */}
          <div className={styles.dialog_footer}>
            <button
              onClick={() => props.onClose()}
              className={styles.close_btn}
            >
              Close
            </button>
          </div>
          
          <div className={styles.help_text}>
            Press ESC or click outside to close
          </div>
        </div>
      </div>
    )
  };

  return (
    <div>
      {/* Dialog overlay */}
      { renderDialog() }
    </div>
  )
};

export default DetailDialog;