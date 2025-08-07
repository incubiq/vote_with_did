// src/hooks/useWalletBackend.js
import { useState, useCallback } from 'react';
import { srv_getDid, srv_getCredsProofs, srv_postAuth, srv_linkWallet, srv_linkAssets, srv_linkBalanceForEnablingVoting } from "../utils/rpc_identity";
import { srv_postWalletType } from "../utils/rpc_settings";

export const useWalletBackend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authenticateUser = useCallback(async (wallet) => {
    setLoading(true);
    setError(null);
    try {
      const response = await srv_postAuth({
        username: "VotingWallet_" + wallet.address.slice(-8),
        seed: wallet.seed
      });
      return response;
    } catch (err) {
      setError("Could not authenticate");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDIDs = useCallback(async () => {
    try {
      const response = await srv_getDid();
      return response.data;
    } catch (err) {
      setError("Could not access DID from wallet");
      throw err;
    }
  }, []);

  const fetchVCs = useCallback(async () => {
    try {
      const response = await srv_getCredsProofs();
      return response.data;
    } catch (err) {
      setError("Could not access Proofs from VwD");
      throw err;
    }
  }, []);

  const registerWalletType = useCallback(async (walletInfo) => {
    try {
      return await srv_postWalletType({
        chain: walletInfo.chain,
        id: walletInfo.id,
        name: walletInfo.name,
        logo: walletInfo.logo,
        networkId: walletInfo.networkId,
      });
    } catch (err) {
      console.warn("Could not register wallet type:", err);
      // Don't throw - this seems non-critical
    }
  }, []);
 
  const linkWallet = useCallback(async (walletData) => {
    try {
      return await srv_linkWallet(walletData);
    } catch (err) {
      setError("Could not link wallet");
      throw err;
    }
  }, []);

  const linkAssets = useCallback(async (walletData) => {
    try {
      return await srv_linkAssets(walletData);
    } catch (err) {
      setError("Could not link wallet assets");
      throw err;
    }
  }, []);

  const linkMinBalance = useCallback(async (_data) => {
    try {
      return await srv_linkBalanceForEnablingVoting(_data);
    } catch (err) {
      setError("Could not link wallet min balance");
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    authenticateUser,
    fetchDIDs,
    fetchVCs,
    registerWalletType,
    linkWallet,
    linkAssets,
    linkMinBalance,
  };
};