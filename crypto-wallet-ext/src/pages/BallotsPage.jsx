// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
	const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
	const [connectedWallets, setConnectedWallets] = useState([]); // Store connected wallets
	const [currentBallot, setCurrentBallot] = useState(null);
	const [questionValidityCheck, setQuestionValidityCheck] = useState({
			isValid: true,
			firstInvalidQuestion: 0,
			error : "OK"
		});
	const [startPublish, setStartPublish] = useState("now");
	const [startDelayedPublish, setStartDelayedPublish] = useState(null);
	const [durationPublish, setDurationPublish] = useState({period: "d", count:4});

	const { state, actions } = useWallet();
    const navigate = useNavigate();

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

	const async_publishBallot = async (_data) => {
		if(!questionValidityCheck || !questionValidityCheck.isValid) {
				toast.error("Fix question errors before publishing");
		}
		else {
			// ok we can publish

		}
		setIsPublishDialogOpen(false);
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

	const renderPublishBallot = ( ) => {
		const aHours=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]
		return (
			<>
				<div>
					<label className={styles.prop}>
						Questions validity check
					</label>
					
					<div className={`${styles.inline} ${styles.bold_underlined} ${questionValidityCheck?.isValid ? "" : styles.error}`} >{questionValidityCheck?.isValid? "OK" : "Error"}</div>
					<div className={styles.error}>&nbsp; &nbsp; {questionValidityCheck?.isValid? "": questionValidityCheck.error}</div>
					<br />
				</div>
				
				<div>
					<label className={styles.prop}>
						Starts
					</label>

					<select className={styles.select}
						onChange={(_e)=> setStartPublish(_e.target.value) }
					>
						<option value="now" >Now</option>
						<option value="delayed" >Delayed</option>
					</select>

					{startPublish=="now"? "":
					<input
						type="text"
						value={currentBallot? currentBallot.opening_at: ""}
						onChange={(e) => updateBallot({opening_at: e.target.value})}
						className={styles.input}
					/>
					}

				</div>

				<div>
					<label className={styles.prop}>
						Duration
					</label>

					<select className={styles.select}
						onChange={(_e)=> setDurationPublish({
							count: parseInt(_e.target.value),
							period: durationPublish.period
						})}
					>
						{aHours.map ((_h, _i) => {
							return (<option key = {_i} value={_h} selected={durationPublish.count === _h}>{_h}</option>)})
						}
					</select>
						&nbsp;
					<select className={styles.select}
						onChange={(_e)=> setDurationPublish({
							count: durationPublish.count,
							period: _e.target.value
						})}
					>
						<option value="h" selected={durationPublish.period === "h"}>Hour(s)</option>
						<option value="d" selected={durationPublish.period === "d"}>Day(s)</option>
						<option value="w" selected={durationPublish.period === "w"}>Week(s)</option>
					</select>

				</div>
			</>
		)
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
							<th># Questions</th>
							<th>&nbsp;</th>
							<th>&nbsp;</th>
							</tr>
						</thead>
						<tbody>
							{state.ballots.map((ballot) => (
							<tr key={ballot.uid}>
								<td>
								<a href={`/ballots/${ballot.id}/questions`}>{ballot.name}</a>
								</td>
								<td>{ballot.questions?.length || 0}</td>

								{!ballot.published_id ?
									<td>
										<img src="icons/icons8-settings-30.png" width = "32" height = "32"  
											onClick={() => {
												changeCurrentBallot(ballot);
												setIsEditDialogOpen(true);
											}}
										/>
									</td>
								:""}

								{!ballot.published_id ?
									<td>
										<img src="icons/icons8-publish-24.png" width = "32" height = "32"  
											onClick={() => {
												changeCurrentBallot(ballot);
												setIsPublishDialogOpen(true);
											}}
										/>
									</td>
								:""}

								{ballot.is_opened && !ballot.is_closed ?
									<td>
										<span>voting in progress until {ballot.closing_at}</span>
									</td>
								:""}

								{ballot.is_closed ?
									<td>
										<img src="icons/icons8-stats-50.png" width = "32" height = "32"  
											onClick={() => {
											}}
										/>
									</td>
								:""}

								{!ballot.published_id ?
									<td>
										<button className = {styles.button} onClick={() => {
											changeCurrentBallot(ballot);
											navigate("/questions?BallotId="+ballot.uid);
										}}>Questions</button>
									</td>
								:""}
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

				<Dialog 
					isVisible = {isPublishDialogOpen}
					title = {currentBallot? "Publish Ballot " + currentBallot.name: ""}
					message = ""
					form = {renderPublishBallot()}
					type = "form"
					textCancel = "Cancel"
					textOK = "Publish"
					onClose = {( ) => setIsPublishDialogOpen(false)}
					onUpdate = {(_name) => async_publishBallot(_name)}
				/>


			</div>

			<BottomNav />
			<ToastContainer />
			
		</div>
  );
};

export default BallotsPage;