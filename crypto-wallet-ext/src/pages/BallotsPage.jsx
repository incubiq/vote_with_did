// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import { useWallet } from '../state/WalletContext';
import { useWalletBackend } from '../hooks/useWalletBackend';
import { useWalletConnection } from '../hooks/useWalletConnection';
import BottomNav from '../components/BottomNav';
import Dialog from '../components/dialog.jsx';
import { srv_postCreateBallot, srv_getBallots, srv_getBallot, srv_patchBallot } from '../utils/rpc_ballot';

import styles from '../styles/Base.module.css';

const BallotsPage = () => {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [connectedWallets, setConnectedWallets] = useState([]); // Store connected wallets
	const [currentBallot, setCurrentBallot] = useState(null);

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

	const async_updateBallot = async (_data) => {
		srv_patchBallot({
			uid: currentBallot.uid,
			name: currentBallot.name,
			opening_at: currentBallot.opening_at,
			closing_at: currentBallot.closing_at,
		})
			.then(_data => {
				if(_data.data==null) {
					throw _data;
				}
				toast.success("Ballot "+currentBallot.name+" was updated");
			})
			.catch(err => {
				toast.error("Could not update ballot ("+err.message+")");
			})

		setIsEditDialogOpen(false);
	}

	const updateBallot = (_data) => {
		let objBallot= currentBallot? {...currentBallot} : {};
		for (const key in _data) {
			objBallot[key]=_data[key]
		}
		setCurrentBallot(objBallot);
	}

	const renderEditBallot = ( )=> {
		return (
			<>
				<div>
					<label className={styles.prop}>
						Name
					</label>

					<input
						type="text"
						value={currentBallot? currentBallot.name: ""}
						onChange={(e) => updateBallot({name: e.target.value})}
						className={styles.input}
					/>
				</div>
				
				<div>
					<label className={styles.prop}>
						Starts at
					</label>

					<input
						type="text"
						value={currentBallot? currentBallot.opening_at: ""}
						onChange={(e) => updateBallot({opening_at: e.target.value})}
						className={styles.input}
					/>
				</div>

				<div>
					<label className={styles.prop}>
						Closes at
					</label>

					<input
						type="text"
						value={currentBallot? currentBallot.closing_at: ""}
						onChange={(e) => updateBallot({closing_at: e.target.value})}
						className={styles.input}
					/>
				</div>
			</>
		)
	}

	return (
		<div className={styles.pageContainer}>
			<h1 className={styles.title}>Your Ballots</h1>
			<div className={styles.container}>
				<div className={styles.section}>
				{state.ballots.length === 0 ? (
					<p>No ballot found</p>
				) : (

					<table className={styles.tableBallot}>
						<thead>
							<tr>
							<th>Name</th>
							<th>Published</th>
							<th>Start Date</th>
							<th>End Date</th>
							<th># Questions</th>
							<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{state.ballots.map((ballot) => (
							<tr key={ballot.id}>
								<td>
								<a href={`/ballots/${ballot.id}/questions`}>{ballot.name}</a>
								</td>
								<td>{ballot.published_id ? 'Yes' : 'No'}</td>
								<td>{ballot.opening_at}</td>
								<td>{ballot.closing_at}</td>
								<td>{ballot.questions?.length || 0}</td>
								<td>
								<button className = {styles.button} onClick={() => {
									setCurrentBallot(ballot);
									setIsEditDialogOpen(true);
								}}>Edit</button>
								</td>
							</tr>
							))}
						</tbody>
					</table>
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

				<Dialog 
					isVisible = {isEditDialogOpen}
					title = "Ballot Editor"
					message = ""
					form = {renderEditBallot()}
					type = "form"
					textCancel = "Cancel"
					textOK = "Update"
					onClose = {( ) => setIsEditDialogOpen(false)}
					onUpdate = {(_data) => async_updateBallot(_data)}
				/>
			</div>

			<BottomNav />
			<ToastContainer />
			
		</div>
  );
};

export default BallotsPage;