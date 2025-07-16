// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import styles from '../styles/BottomNav.module.css';

const BottomNav = () => {
  const { state, actions } = useWallet();

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.bottomNav}>
      <button 
        className={`${styles.navButton} ${isActive('/dashboard') ? styles.active : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        Dashboard
      </button>

      <button 
        className={`${styles.navButton} ${isActive('/votes') ? styles.active : ''}`}
        onClick={() => navigate('/votes')}
      >
        Votes
      </button>

      {state.authorization=="admin" ?
        <button 
          className={`${styles.navButton} ${isActive('/ballots') ? styles.active : ''}`}
          onClick={() => navigate('/ballots')}
        >
          Ballots
        </button>
      :""}

      <button 
        className={`${styles.navButton} ${isActive('/vcs') ? styles.active : ''}`}
        onClick={() => navigate('/vcs')}
      >
        Credentials
      </button>

      <button 
        className={`${styles.navButton} ${isActive('/profile') ? styles.active : ''}`}
        onClick={() => navigate('/profile')}
      >
        Profile
      </button>
    </nav>
  );
};

export default BottomNav;