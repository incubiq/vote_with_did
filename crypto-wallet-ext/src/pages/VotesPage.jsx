// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import { useWallet } from '../state/WalletContext';
import { useWalletBackend } from '../hooks/useWalletBackend';
import { useWalletConnection } from '../hooks/useWalletConnection';
import BottomNav from '../components/BottomNav';
import YesNoDialog from '../components/yesnoDialog';
import VotingPanel from '../components/votingPanel';
import VoterSelfRegistrationPanel from '../components/voterSelfRegistrationPanel';

import { srv_getPublicBallots, srv_canVote } from '../utils/rpc_ballot';
import { getHowLongUntil } from '../utils/misc';

import styles from '../styles/Base.module.css';

const PANEL_AWAITING_REGISTRATION = "awaiting_registration";
const PANEL_AWAITING_VOTE = "awaiting_vote";
const PANEL_VOTED = "voted";
const PANEL_STATS_AVAILABLE = "stats";


const VotesPage = () => {
	const [isYesNoDialogOpen, setIsYesNoDialogOpen] = useState(false);
	const [isVotingPanelOpen, setIsVotingPanelOpen] = useState(false);
	const [isVoterSelfRegistrationPanelOpen, setIsVoterSelfRegistrationPanelOpen] = useState(false);
	
	const [connectedWallets, setConnectedWallets] = useState([]); // Store connected wallets
	const [panel, setPanel] = useState(PANEL_AWAITING_REGISTRATION);

	const [aBallotOpenForRegistration, setABallotOpenForRegistration] = useState([]);
	const [aBallotOpenForVote, setABallotOpenForVote] = useState([]);
	const [iBallotOpenForVote, setIBallotOpenForVote] = useState(0);
	const [aBallotOpenForStats, setABallotOpenForStats] = useState([]);
	const [aProofOfVote, setAProofOfVote] = useState([]);
	const { state, actions } = useWallet();

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

	useEffect(() => {
			async_loadPublicBallots();
	}, []);

	useEffect(() => {
		if(aBallotOpenForVote.length>0) {
			let _aPoV=[];
			for  (var i=0; i<aBallotOpenForVote.length; i++ ) {
				const _aProofOfVote= state.vcs.filter(item => item.claims?.claim_type === "proof_of_vote" && item.claims?.delegatedAuthority === aBallotOpenForVote[i].published_id);
				if(_aProofOfVote.length>0) {
					_aPoV.push(_aProofOfVote[0]);
				}
			}
			setAProofOfVote(_aPoV);
		}
	}, [state.vcs, aBallotOpenForVote]);

	const async_loadPublicBallots = async() => {
		srv_getPublicBallots({
			isOpenForRegistration: true,
	    	isOpenForVote: true,
    		isOpenForStats: true,

		})
			.then(_data => {
				if(_data.data ) {
					setABallotOpenForRegistration(_data.data.aAwaitReg);
					setABallotOpenForVote(_data.data.aAwaitVote);
					setABallotOpenForStats(_data.data.aAvailStats);
				}
			})
			.catch(err => {
				toast.error("Could not load ballots ("+err.message+")");
			})
	}
	
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

	const onHasVoted = (_aAnswer) => {
		// 
	}

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
			setIsYesNoDialogOpen(false);
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

	const renderRequestCreds = ( )=> {
		return (
			<>
			<a onClick={()=> setIsYesNoDialogOpen(true)}>Register Proof Of Voting power to vote... </a>
			</>
		)
	}

	const onHasSelfRegistered = (_data) => {
		// not sure we should do anything?
	}

	const hasSelfRegistered = (_didBallot) => {
		const aReg = state.vcs.filter(item => item.claims?.delegatedAuthority === _didBallot)
		return aReg.length>0;
	}

	const hasVoted = (_id)=> {
		let _bHasVoted=false;
		aProofOfVote.forEach(item => {
			if(item.claims.delegatedAuthority==_id) {
				_bHasVoted=true;
			}
		})
		return _bHasVoted;
	}

	const renderBallotsAwaitingRegistration = ( )=> {
		return (				
			<>
			{panel==PANEL_AWAITING_REGISTRATION ?
			<>
			{aBallotOpenForRegistration.length>0? 
				
				<table className={styles.tableBallot}>
					<thead>
						<tr>
						<th>Ballot</th>
						<th>#Q</th>
						<th>When</th>
						<th></th>
						</tr>
					</thead>
					<tbody>
						{aBallotOpenForRegistration.map((ballot) => (
						<tr key={ballot.uid}>
							<td>
							{ballot.name}
							</td>
							<td>{ballot.aQuestion?.length || 0}</td>

							<td>
								<span>{getHowLongUntil(ballot.openingRegistration_at)!=null ? 
									"opening in "+getHowLongUntil(ballot.openingRegistration_at)
									: "closing in "+getHowLongUntil(ballot.closingRegistration_at)
								}</span>
							</td>

							<td>
								{hasSelfRegistered(ballot.published_id) ?
								<div className={styles.italic}>
									✅ self-registered
								</div>
								:
								<div className={styles.button} 
									onClick={() => {
										setIsVoterSelfRegistrationPanelOpen(true);
									}}
								>
									Register...
								</div>
								}
							</td>


						</tr>
						))}
					</tbody>
				</table>
				:
				<div className={styles.section}>
					<p>No ballot in registration phase yet</p>
				</div>
			}
			</>
			:""}
			</>
		)
	}

	const renderBallotsAwaitingVote = ( )=> {
		return (				
			<>
			{panel==PANEL_AWAITING_VOTE ?
			<>
			{aBallotOpenForVote.length>0? 
				
				<table className={styles.tableBallot}>
					<thead>
						<tr>
						<th>Ballot</th>
						<th>#Q</th>
						<th>When</th>
						<th></th>
						</tr>
					</thead>
					<tbody>
						{aBallotOpenForVote.map((ballot, iBallot) => (
						<tr key={ballot.uid}>
							<td>
							{ballot.name}
							</td>
							<td>{ballot.aQuestion?.length || 0}</td>

							<td>
								<span>{getHowLongUntil(ballot.openingVote_at)!=null ? 
									"opening in "+getHowLongUntil(ballot.openingVote_at)
									: "closing in "+getHowLongUntil(ballot.closingVote_at)
								}</span>
							</td>

							<td>
								{hasVoted(ballot.published_id)? 
								<div className={styles.italic}>
									✅ Voted
								</div>
								:
								<div className={styles.button} 
									onClick={() => {
										if(aBallotOpenForVote.length>0) {
											setIBallotOpenForVote(iBallot);
											setIsVotingPanelOpen(true);
										}
										else {
										toast.error("No ballot open for vote yet.")
										}
									}}
								>
									Vote...
								</div>}
							</td>


						</tr>
						))}
					</tbody>
				</table>
				:
				<div className={styles.section}>
					<p>No ballot opened for voting yet</p>
				</div>
			}
			</>
			:""}
			</>
		)
	}

	const renderBallotsWithStats = ( )=> {
		return (				
			<>
			{panel==PANEL_STATS_AVAILABLE ?
			<>
			{aBallotOpenForStats.length>0? 
				
				<table className={styles.tableBallot}>
					<thead>
						<tr>
						<th>Ballot</th>
						<th>#Q</th>
						<th></th>
						</tr>
					</thead>
					<tbody>
						{aBallotOpenForStats.map((ballot) => (
						<tr key={ballot.uid}>
							<td>
							{ballot.name}
							</td>
							<td>{ballot.aQuestion?.length || 0}</td>

							<td>
								<div className={styles.button} 
									onClick={() => {
									}}
								>
									Stats...
								</div>
							</td>


						</tr>
						))}
					</tbody>
				</table>
				:
				<div className={styles.section}>
					<p>No ballot available for stats yet</p>
				</div>
			}
			</>
			:""}
			</>
		)
	}

	return (
		<div className={styles.pageContainer}>
			<h1 className={styles.title}>My Votes</h1>
			<div className={styles.container}>
			
				<a className={panel==PANEL_AWAITING_REGISTRATION? styles.bold_underlined: ""} onClick={() => setPanel(PANEL_AWAITING_REGISTRATION)}>Awaiting Reg. ({aBallotOpenForRegistration.length})</a>
				&nbsp; - &nbsp;
				<a className={panel==PANEL_AWAITING_VOTE? styles.bold_underlined: ""} onClick={() => setPanel(PANEL_AWAITING_VOTE)}>Awaiting Vote({aBallotOpenForVote.length})</a>
				&nbsp; - &nbsp;
				<a className={panel==PANEL_STATS_AVAILABLE? styles.bold_underlined: ""} onClick={() => setPanel(PANEL_STATS_AVAILABLE)}>Stats ({aBallotOpenForStats.length})</a>

				<br />
				<br />

				{renderBallotsAwaitingRegistration()}
				{renderBallotsAwaitingVote()}
				{renderBallotsWithStats()}

			</div>

			<YesNoDialog 
				isOpen = {isYesNoDialogOpen}
				title = "Generate a Proof of voting Power?"
				message = "Press Yes to Generate a Proof (we will take your cumulated ADA balance of all linked wallets) - The proof will be issued within around 30 secs"
				onNo = {( ) => setIsYesNoDialogOpen(false)}
				onYes = {( ) => async_genProofOfVotingPower()}
			/>

			<VoterSelfRegistrationPanel 
				isVisible = {isVoterSelfRegistrationPanelOpen}
				onClose = {() => setIsVoterSelfRegistrationPanelOpen(false)}
				onHasSelfRegistered = {(_data) => onHasSelfRegistered(_data)}
				ballot = {aBallotOpenForRegistration[0]}
				aVC_ownership = {state.vcs.filter(item => item.claims?.claim_type === "address_ownership")}
			/>

			<VotingPanel 
				isVisible = {isVotingPanelOpen}
				onClose = {() => setIsVotingPanelOpen(false)}
				onHasVoted = {(_aAnswers) => onHasVoted(_aAnswers)}
				ballot = {aBallotOpenForVote[0]}
				aVC_eligibility = {state.vcs.filter(item => {item.claims?.claim_type === "proof_of_min" && aBallotOpenForVote.length>0 && item.claims?.delegatedAuthority === aBallotOpenForVote[iBallotOpenForVote].published_id})}
			/>

			<BottomNav />
			<ToastContainer />
		</div>
  );
};

export default VotesPage;