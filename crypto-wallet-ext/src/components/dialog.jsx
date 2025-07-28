import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Base.module.css';

const BasicDialog = (props) => {
  const [value, setValue] = useState(props.value || '');

  const handleCancel = useCallback(() => {
    // reset the UI value to the original one
    setValue(props.value);
    props.onClose();
  }, [props.value, props.onClose]);

  // Handle ESC key press + Prevent scroll when dialog is open
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {handleCancel()};
    };
    
    if (props.isVisible) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [props.isVisible, handleCancel]);

  // re-init value if changed
  useEffect(() => {
    if(props.value) {
      setValue(props.value);
    }
    else {
      if(props.options) {
        setValue(props.options[0]);
      }
      else {
        setValue("");
      }
    }
  }, [props.value, props.options]);

  const handleSave = () => {
    props.onUpdate(value);
    props.onClose();
  };

  return (
    <>
    {props.isVisible?
      <>
      {/* Backdrop */}
      <div 
        className={styles.dialogBackground}
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        className={styles.modal}
      >
        <div className="relative">
          <h2 className={styles.heading}>
            {props.title}
          </h2>

          <div className="mb-6">
            {props.property?
            <label className={styles.prop}>
              {props.property}
            </label>
            :""}

            {props.fnRender? props.fnRender() :""}

            {/* CONTENT (various types) */}
            {props.type =="textarea" ?
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows="4"
                className={styles.textarea}
                placeholder={"Enter text for "+props.property}
              />
            : ""}

            {props.type =="input" ?
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={styles.input}
              />
            : ""}

            {props.type =="select" ?
              <select
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if(props.onSelect) {
                    props.onSelect(e.target.value);
                  }
                }}
                className={styles.input}
                >
                  {props.options.map((item, index) => {
                    return (
                      <option key = {index} value={item} >{item}</option>
                    )
                  })}
              </select>
            :""}

            {props.type == "checkbox"? 
             <input
              checked={value==true}
              onChange={(e) => setValue(e.target.value)}
              className="h-4 w-4 text-blue-500 rounded border-gray-300 
                focus:ring-blue-500"
            />
            : ""}

            {props.type =="image" ?
              <img
                width="64"
                height="64"
                src={props.src}
                alt = "image"
              />
            : ""}

            {props.type =="form" ?
              <div>
                {props.form}
              </div>
            : ""}
          </div>

          <div className={styles.actionBar}>
            <button 
              onClick={handleCancel}
              className={`${styles.button} ${styles.cancel}` }
            >
              {props.textCancel? props.textCancel: "Cancel"}
            </button>

              {props.onUpdate? 
                <button
                  onClick={handleSave}
                  className={styles.button}
                >
                  {props.textOK? props.textOK: "OK"}
                </button>
              : ""}
          </div>

          {/* Close button */}
          <button 
            onClick={handleCancel}
            className={styles.closeCross}
          >
            <span className="sr-only">Close</span>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      </>
      :""}
    </>
  );
};

export default BasicDialog;