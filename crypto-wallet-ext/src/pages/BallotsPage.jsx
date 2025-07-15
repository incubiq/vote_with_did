// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import { useWallet } from '../state/WalletContext';
import { useWalletBackend } from '../hooks/useWalletBackend';
import { useWalletConnection } from '../hooks/useWalletConnection';
import BottomNav from '../components/BottomNav';
import Dialog from '../components/dialog.jsx';
import { srv_postCreateBallot, srv_getBallots } from '../utils/rpc_ballot';

import styles from '../styles/Base.module.css';

const BallotsPage = () => {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [connectedWallets, setConnectedWallets] = useState([]); // Store connected wallets

	const { state, actions } = useWallet();

	const async_loadBallots = async() => {
		srv_getBallots()
			.then(_data => {
				actions.ballotsSet(_data.data);
			})
			.catch(err => {
				toast.error("Could not load all ballots ("+err.message+")");
			})
	}

	const async_createBallot = async (_name) => {
		setIsCreateDialogOpen(false);

		// create ballot with user as admin
		srv_postCreateBallot({
			name: _name
		})
			.then(_data => {
				if(_data.data==null) {
					throw _data;
				}

				toast.success("Ballot "+_name+" was created");

				// now load all my ballots
				async_loadBallots();
			}) 
			.catch(err => {
				toast.error("Could not create ballot ("+err.message+")");
			})
	}

	return (
		<div className={styles.pageContainer}>
			<h1 className={styles.title}>Your Ballots</h1>
			<div className={styles.container}>
				<div className={styles.section}>
				{state.ballots.length === 0 ? (
					<p>No ballot found</p>
				) : (
					<ul className={styles.list}>
					{state.ballots.map((ballot, index) => (
						<li key={index} className={styles.listItem}>
							<div className={styles.value}>Name: {ballot.name}</div>
							<div className={styles.value}>Published? {ballot.published_id? "Yes": "No"}</div>
							{ballot.published_id?
							<>
								<div className={styles.value}>Open? {ballot.is_open? "Yes": "No"}</div>
								<div className={styles.value}>Closed? {ballot.is_closed? "Yes": "No"}</div>
							</>
							:""}
							
						</li>
					))}
					</ul>
				)}
				</div>

				<a onClick={()=> setIsCreateDialogOpen(true)}>Create a new Ballot... </a>
				<Dialog 
					isVisible = {isCreateDialogOpen}
					title = "Create a new Ballot"
					message = "Press Yes to create a ballot that you will administrate"
					property = "Ballot name"
					value = ""
					type = "input"
					onClose = {( ) => setIsCreateDialogOpen(false)}
					onUpdate = {(_name) => async_createBallot(_name)}
				/>

			</div>

			<BottomNav />
			<ToastContainer />
			
		</div>
  );
};

export default BallotsPage;