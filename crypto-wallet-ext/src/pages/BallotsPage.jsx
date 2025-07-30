// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import { useWallet } from '../state/WalletContext';
import { useWalletBackend } from '../hooks/useWalletBackend';
import { useWalletConnection } from '../hooks/useWalletConnection';
import BottomNav from '../components/BottomNav';
import Dialog from '../components/dialog.jsx';
import DialogPublishBallot from '../components/publishBallot.jsx';
import { srv_postCreateBallot, srv_getBallots, srv_getBallot, srv_patchBallot, srv_publishBallot } from '../utils/rpc_ballot';

import styles from '../styles/Base.module.css';

const BallotsPage = () => {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
	const [connectedWallets, setConnectedWallets] = useState([]); // Store connected wallets
	const [aBallotInCreation, setABallotInCreation] = useState([]);
	const [aBallotInRegistration, setABallotInRegistration] = useState([]);
	const [aBallotInVoting, setABallotInVoting] = useState([]);
	const [currentBallot, setCurrentBallot] = useState(null);
	const [questionValidityCheck, setQuestionValidityCheck] = useState({
			isValid: true,
			firstInvalidQuestion: 0,
			error : "OK"
		});
	
	const { state, actions } = useWallet();
    const navigate = useNavigate();

	useEffect(() => {
		async_loadBallots();
	}, []);

	const async_loadBallots = async() => {
		srv_getBallots()
			.then(_data => {
				actions.ballotsSet(_data.data);
				if(_data.data && _data.data.length>0) {
					let _aInCreation = [];
					let _aInRegistration = [];
					let _aInVoting = [];
					_data.data.forEach(_ballot => {
						if(_ballot.is_openedToVote && !_ballot.is_closedToVote) {
								_aInVoting.push(_ballot);
						}
						else {
							if((_ballot.is_openedToRegistration && !_ballot.is_closedToRegistration) || _ballot.published_at!=null) {
								_aInRegistration.push(_ballot);
							}
							else {
								_aInCreation.push(_ballot);
							}
						}
					})
					setABallotInCreation(_aInCreation);
					setABallotInRegistration(_aInRegistration);
					setABallotInVoting(_aInVoting);
				}
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
		changeCurrentBallot(objBallot);
	}

	const changeCurrentBallot = (_ballot)=> {
		setCurrentBallot(_ballot);
		
		// now check validity 
		let bHasContent = true;
		let bHasTitle = true;
		let bHasEnoughQuestions = _ballot.aQuestionInFull.length>0;
		let bHasEnoughChoices = true;
		let bHasChoiceText = true;
		let bIsValid = true;
		let iQ=-1;
		let errorMsg = "OK";

		_ballot.aQuestionInFull.forEach((q, _iQ) => {
			bHasTitle= bHasTitle && (q.title !== "");
			if(!bHasTitle) {errorMsg = "Question "+(_iQ+1) +" must have a title"}
			bHasContent= bHasContent && (q.rich_text !== "" && q.rich_text !== "awaiting content");
			if(!bHasContent) {errorMsg = "Question "+(_iQ+1) +" must have a content"}
			bHasEnoughChoices= q.aChoice.length>1;
			if(!bHasEnoughChoices) {errorMsg = "Answers of question "+(_iQ+1) +" must have at least 2 choices"}
			q.aChoice.forEach((a, _iA) => {
				bHasChoiceText= bHasChoiceText && a.text!=="";
				if(!bHasChoiceText) {errorMsg = "Answer "+(_iA+1)+" of question "+(_iQ+1) +" must have a text"}
			});

			bIsValid = bHasContent && bHasTitle && bHasEnoughQuestions && bHasEnoughChoices && bHasChoiceText;
			if(!bIsValid && iQ == -1) {iQ = _iQ}
		})

		setQuestionValidityCheck({
			isValid: bIsValid,
			firstInvalidQuestion: (iQ+1),
			error : errorMsg
		})
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
				
				
			</>
		)
	}

	const renderBallotsInCreation = ( )=> {
		return (
			<>
				<h3>In creation...</h3>
				<table className={styles.tableBallot}>
					<thead>
						<tr>
						<th>Name</th>
						<th>#Q</th>
						<th>&nbsp;</th>
						<th>&nbsp;</th>
						</tr>
					</thead>
					<tbody>
						{aBallotInCreation.map((ballot) => (
						<tr key={ballot.uid}>
							<td>
							<a href={`/ballots/${ballot.id}/questions`}>{ballot.name}</a>
							</td>
							<td>{ballot.aQuestion?.length || 0}</td>

							<td>
								<img src="icons/icons8-settings-30.png" width = "32" height = "32"  
									onClick={() => {
										changeCurrentBallot(ballot);
										setIsEditDialogOpen(true);
									}}
								/>
							</td>

							<td>
								<img src="icons/icons8-publish-24.png" width = "32" height = "32"  
									onClick={() => {
										changeCurrentBallot(ballot);
										setIsPublishDialogOpen(true);
									}}
								/>
							</td>

							<td>
								<button className = {styles.button} onClick={() => {
									changeCurrentBallot(ballot);
									navigate("/questions?BallotId="+ballot.uid);
								}}>Questions</button>
							</td>
						</tr>
						))}
					</tbody>
				</table>
			</>
		)
	}

	const renderBallotsInRegistration = ( )=> {
			return (
				<>
					<h3>In registration phase...</h3>
					<table className={styles.tableBallot}>
					<thead>
						<tr>
						<th>Name</th>
						<th>#Q</th>
						<th>Start</th>
						<th>Stop</th>
						<th>Stats</th>
						</tr>
					</thead>
					<tbody>
						{aBallotInRegistration.map((ballot) => (
						<tr key={ballot.uid}>
							<td>
							<a href={`/ballots/${ballot.id}/questions`}>{ballot.name}</a>
							</td>
							<td>{ballot.aQuestion?.length || 0}</td>

							<td>
								<span>{ballot.openingRegistration_at}</span>
							</td>

							<td>
								<span>{ballot.closingRegistration_at}</span>
							</td>

							<td>
								<img src="icons/icons8-stats-50.png" width = "32" height = "32"  
									onClick={() => {
									}}
								/>
							</td>


						</tr>
						))}
					</tbody>
				</table>
				</>
			)
	}

	const renderBallotsInVoting = ( )=> {
			return (
				<>
					<h3>In voting...</h3>
					TODO
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

					<>
					{aBallotInCreation.length>0? 
						renderBallotsInCreation()
					:""}

					{aBallotInRegistration.length>0? 
						renderBallotsInRegistration()
					:""}

					{aBallotInVoting.length>0? 
						renderBallotsInVoting()
					:""}
					</>

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

				<DialogPublishBallot 
					isVisible = {isPublishDialogOpen}
					ballot = {currentBallot}
					validityCheck = {questionValidityCheck}
					onClose = {( ) => setIsPublishDialogOpen(false)}
				/>

			</div>

			<BottomNav />
			<ToastContainer />
			
		</div>
  );
};

export default BallotsPage;