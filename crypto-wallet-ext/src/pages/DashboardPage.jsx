import React, { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../state/WalletContext';
import { useBallot } from '../hooks/useBallot';
import { useWalletBackend } from '../hooks/useWalletBackend';
import { useWalletConnection } from '../hooks/useWalletConnection';
import WalletList from '../components/WalletList';
import BottomNav from '../components/BottomNav';
import styles from '../styles/Base.module.css';

const WalletDashboard = () => {
  const { state, actions } = useWallet();
  const [availableBallots] = useState([]); // Placeholder for future ballot functionality
  const initializationRef = useRef(false);
  const navigate = useNavigate();
  
  const {
    loading: backendLoading,
    error: backendError,
    authenticateUser,
    fetchDIDs,
    fetchVCs,
    registerWalletType,
    linkWallet
  } = useWalletBackend();

  const {
    fetchBallots,
  } = useBallot();

// Handle wallet detection and registration
  const handleWalletDetected = useCallback(async (wallets) => {
    // Register each detected wallet with backend
    const registrationPromises = wallets.map(wallet => registerWalletType(wallet));
    await Promise.allSettled(registrationPromises);
  }, [registerWalletType]);

  // Handle successful wallet connection
  const handleWalletConnected = useCallback(async (walletData) => {
    if (!walletData.wallet?.isEnabled) return;

    try {
      const assets = await checkWallet(walletData.wallet.id);
      
      if (assets.didUserAccept && assets.wallet.hasReplied && assets.wallet.isEnabled) {
        await linkWallet({
          address: assets.assets.stakeAddress,
          chain: walletData.wallet.chain.symbol,
          networkId: walletData.wallet.chain.id
        });
      }
    } catch (err) {
      console.error("Error handling wallet connection:", err);
    }
  }, [linkWallet]);

  const {
    availableWallets,
    connecting,
    connectWallet,
    checkWallet
  } = useWalletConnection({
    onWalletDetected: handleWalletDetected,
    onWalletConnected: handleWalletConnected
  });

  const handleConnectWallet = useCallback(async (wallet) => {
    try {
      await connectWallet(wallet.id);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [connectWallet]);

  // Initialize user session and load data
  React.useEffect(() => {
    if (state.status !== 'ready' || !state.wallet) {
      navigate('/');
      return;
    }

    if (initializationRef.current) {
      return; // Already initialized
    }

    const initializeSession = async () => {
      try {
        initializationRef.current = true;
        await authenticateUser(state.wallet);
        
        // Load DIDs and VCs in parallel
        const [dids, vcs] = await Promise.allSettled([
          fetchDIDs(),
          fetchVCs()
        ]);

        if (dids.status === 'fulfilled') {
          actions.identusDiDSet(dids.value);
        }
        
        if (vcs.status === 'fulfilled') {
          actions.identusVCSet(vcs.value);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
      }
    };

    initializeSession();
  }, [state.status, state.wallet, navigate, authenticateUser, fetchDIDs, fetchVCs, actions]);

  React.useEffect(() => {
    initializationRef.current = false;
  }, [state.wallet?.address]);
  
  if (state.status !== 'ready' || !state.wallet) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={styles.title}>Wallets</h1>
        
        {backendError && (
          <div className={styles.error}>
            Error: {backendError}
          </div>
        )}
        
        <WalletList 
          wallets={availableWallets}
          onConnectWallet={handleConnectWallet}
          connecting={connecting}
        />
      </div>

      {availableBallots && availableBallots.length > 0 && (
        <h1 className={styles.title}>Available Ballots</h1>
      )}

      <BottomNav />
    </div>
  );
};

export default WalletDashboard;