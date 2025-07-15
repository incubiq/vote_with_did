import React, { useState, useEffect } from 'react'

// notification
import { toast } from 'react-toastify';
import  {async_copyToClipboard} from '../utils/misc';

import styles from '../styles/Base.module.css';

import Dialog from "./dialog.jsx";

const PropValControl = (props) => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);  

  const onCloseDialog = () => {
    setIsDialogVisible(false);
  }

  const onUpdate = (_value) => {
    if (props.onUpdate) {
      props.onUpdate(_value);
    }
  }

  const _getShortValue = (_u) => {
    let _maxLength= props.maxLength? props.maxLength : 15;    // max chares to display..

    if(!_u) {
      if(props.showAnonValue===true)  {return "********"}
      return null;
    }

    if(props.type=="datetime") {
      return new Date(props.value).toLocaleString("en-GB", { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short',
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    }

    _u = _u.toString();
    if(_u.length<_maxLength) {return _u}
    return _u.substring(0, 6) + "..."+ _u.substring(_u.length-6, _u.length);
  }

  return (
    <div
      className= {styles.propvalContainer}
    >
        <span
          className= {styles.prop}
        >
          {props.property}:
        </span>  

        <span
          className= {styles.val}
        >
          {_getShortValue(props.value)}
        </span>  

        {props.hasCopy? 
          <div
            width = "24"
            height = "24"
            className= {styles.copy}
            onClick = {async() => {
                let bRet = await async_copyToClipboard(props.value);
                if(bRet) {
                  toast.success(_getShortValue(props.value)+ " was copied to the clipboard");
                }
                else {
                  toast.error("Could not copy value to the clipboard");
                }
              }
            }
          > 
          <img src="icons/icons8-copy-32.png" width = "24" height = "24" />
          </div>
        :""}

        {props.canEdit? 
          <>
            <div
              width = "24"
              height = "24"
              className= {styles.copy}
              onClick = {async() => {
                setIsDialogVisible(true);
              }}
            >            
              <img src="icons/icons8-edit-24.png" width = "24" height = "24" />
            </div>

            <Dialog 
              isVisible = {isDialogVisible}
              property = {props.property}
              value = {props.value}
              type = {props.type}
              options = {props.options}
              title = {props.title}
              onClose = {onCloseDialog}
              onUpdate = {onUpdate}              
            />
          </>
        : ""}

    </div>
  );
};

export default PropValControl;