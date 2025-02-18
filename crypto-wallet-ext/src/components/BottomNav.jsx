// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../styles/BottomNav.module.css';

const BottomNav = () => {
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
        className={`${styles.navButton} ${isActive('/dids') ? styles.active : ''}`}
        onClick={() => navigate('/dids')}
      >
        DIDs
      </button>
      <button 
        className={`${styles.navButton} ${isActive('/vcs') ? styles.active : ''}`}
        onClick={() => navigate('/vcs')}
      >
        VCs
      </button>
      <button 
        className={`${styles.navButton} ${isActive('/settings') ? styles.active : ''}`}
        onClick={() => navigate('/settings')}
      >
        Settings
      </button>
    </nav>
  );
};

export default BottomNav;