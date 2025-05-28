// src/hooks/useWalletConnection.js
import { useState, useEffect, useCallback } from 'react';
import { siww } from '../utils/siww/siww';

const _siww = new siww();
const gSIWW = _siww.getConnector("SIWC");

export const useWalletConnection = ({ onWalletDetected, onWalletConnected }) => {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    gSIWW.async_initialize({
      onNotifyAccessibleWallets: (wallets) => {
        setAvailableWallets(wallets);
        onWalletDetected?.(wallets);
      },
      onNotifyConnectedWallet: async (wallet) => {
        setConnecting(false);
        onWalletConnected?.(wallet);
      },
      onNotifySignedMessage: (wallet) => {
        // Handle signed messages if needed
      },
    });
  }, [onWalletDetected, onWalletConnected]);

  const connectWallet = useCallback(async (walletId) => {
    setConnecting(true);
    try {
      await gSIWW.async_connectWallet(walletId);
    } catch (err) {
      setConnecting(false);
      throw err;
    }
  }, []);

  const checkWallet = useCallback(async (walletId) => {
    return await gSIWW.async_checkWallet(walletId);
  }, []);

  return {
    availableWallets,
    connecting,
    connectWallet,
    checkWallet
  };
};