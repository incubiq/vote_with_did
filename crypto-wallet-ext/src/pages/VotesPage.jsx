// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../state/WalletContext';
import { useWalletBackend } from '../hooks/useWalletBackend';
import { useWalletConnection } from '../hooks/useWalletConnection';
import BottomNav from '../components/BottomNav';
import YesNoDialog from '../components/yesnoDialog';

import styles from '../styles/Base.module.css';

const VotesPage = () => {
	const [isYesNoDialogOpen, setIsYesNoDialogOpen] = useState(false);
	const [connectedWallets, setConnectedWallets] = useState([]); // Store connected wallets

	const { state } = useWallet();

	const {
		loading: backendLoading,
		error: backendError,
		authenticateUser,
		linkAssets
	} = useWalletBackend();

	// Handle wallet detection and registration
	const handleWalletDetected = useCallback(async (wallets) => {
		// do nothing
	}, []);

	const handleWalletConnected = useCallback(async (walletData) => {
		if (!walletData.wallet?.isEnabled) return;

		setConnectedWallets(prev => {
			// Check if wallet already exists (prevent duplicates)
			const exists = prev.find(w => w.id === walletData.wallet.id);
			if (exists) {
				// Update existing wallet
				return prev.map(w => 
				w.id === walletData.wallet.id 
					? { ...w, ...walletData.wallet }
					: w
				);
			} else {
				// Add new wallet
				return [...prev, walletData.wallet];
			}
		});

	}, []);

	const {
		availableWallets,
		connecting,
		connectWallet,
		checkWallet
		} = useWalletConnection({
		onWalletDetected: handleWalletDetected,
		onWalletConnected: handleWalletConnected
		});

	const async_genProofOfVotingPower = async() => {
		try {
			if (connectedWallets.length === 0) {
				alert("No connected wallets found. Please connect at least one wallet first.");
				return;
			}
			
			// Process each connected wallet
			console.log(`Generating proof for ${connectedWallets.length} connected wallets...`);
			for (const wallet of connectedWallets) {
				try {
				
					// Link the wallet assets (generate proof)
					const linkResult = await linkAssets({
						address: wallet.address,
						chain: wallet.chain.symbol,
						networkId: wallet.chain.id,
					});

				} catch (walletError) {
					console.error(`Error processing wallet ${wallet.name}:`, walletError);
				}
			}

		} catch (err) {
			alert(`Error generating proof of Voting Power: ${err.message}`);		
		}
	}	

	return (
		<div className={styles.pageContainer}>
			<h1 className={styles.title}>Your Votes</h1>
			<div className={styles.container}>
				<div className={styles.section}>
				{state.ballots.length === 0 ? (
					<p>No ballot found</p>
				) : (
					<ul className={styles.list}>
					{state.ballots.map((did, index) => (
						<li key={index} className={styles.listItem}>
						<span className={styles.property}>prop</span>
						<span className={styles.value}>val</span>
						</li>
					))}
					</ul>
				)}
				</div>

				<a onClick={()=> setIsYesNoDialogOpen(true)}>Register Proof Of Voting power to vote... </a>
				<YesNoDialog 
				isOpen = {isYesNoDialogOpen}
				title = "Generate a Proof of voting Power?"
				message = "Press Yes to Generate a Proof (we will take your cumulated ADA balance of all linked wallets) - The proof will be issued within around 30 secs"
				onNo = {( ) => setIsYesNoDialogOpen(false)}
				onYes = {( ) => async_genProofOfVotingPower()}
				/>

			</div>

			<BottomNav />
		</div>
  );
};

export default VotesPage;