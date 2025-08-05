// src/hooks/useWalletBackend.js
import { useState, useCallback } from 'react';
import { srv_getBallots, srv_getRequirements } from "../utils/rpc_ballot";

export const useBallot = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBallots = useCallback(async () => {
    try {
      const response = await srv_getBallots();
      return response.data;
    } catch (err) {
      setError("Could not access your Ballots");
      throw err;
    }
  }, []);

  const getRequirements = useCallback(async () => {
    try {
      const response = await srv_getRequirements();
      return response.data;
    } catch (err) {
      setError("Could not get ballot requirements");
      throw err;
    }
  }, []);


  return {
    fetchBallots,
    getRequirements,
  };
};