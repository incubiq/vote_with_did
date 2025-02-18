// src/components/PinDialog.jsx
import React, { useState } from 'react';
import styles from '../styles/PinDialog.module.css';
import styleM from '../styles/Base.module.css';

const PinDialog = ({ onSubmit, onClose, isSetup = false }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');

    if (isSetup) {
      // Validate PIN during setup
      if (pin.length < 6) {
        setError('PIN must be at least 6 digits');
        return;
      }
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
    }

    onSubmit(pin);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <h2>{isSetup ? 'Set PIN' : 'Enter PIN'}</h2>
        
        <input
          type="password"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className={styles.input}
        />

        {isSetup && (
          <input
            type="password"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            className={styles.input}
          />
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button 
          onClick={handleSubmit}
          className={styles.button}
        >
          {isSetup ? 'Set PIN' : 'Submit'}
        </button>

        <button 
          onClick={onClose}
          className={styleM.backButton}
        >
          ← Back
        </button>

      </div>
    </div>
  );
};

export default PinDialog;