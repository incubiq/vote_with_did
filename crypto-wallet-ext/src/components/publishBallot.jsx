// src/pages/VotesPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';

import { useWallet } from '../state/WalletContext.jsx';
import { useWalletBackend } from '../hooks/useWalletBackend.jsx';
import { useWalletConnection } from '../hooks/useWalletConnection.jsx';
import BottomNav from './BottomNav.jsx';
import Dialog from './dialog.jsx';
import {  srv_publishBallot } from '../utils/rpc_ballot.js';

import styles from '../styles/Base.module.css';

const aHours=[0, 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]

const DialogPublishBallot = (props) => {
	
	const [openRegistration_at, setOpenRegistration_at] = useState("now");
	const [durationRegistration, setDurationRegistration] = useState({period: "d", count:4});
	const [delayedRegistration, setDelayedRegistration] = useState("");
	const [openVoting_at, setOpenVoting_at] = useState("immediate");
	const [durationVoting, setDurationVoting] = useState({period: "d", count:4});
	const [delayedVoting, setDelayedVoting] = useState("");

	const [credsRequirement, setCredsRequirement] = useState("none");
	
	const async_publishBallot = async (_data) => {
		if(!props.validityCheck || !props.validityCheck.isValid) {
			toast.error("Fix question errors before publishing");
			props.onClose();
		}
		else {
			// ok we can publish
			const openingRegistration_at=openRegistration_at=="now"? new Date() : new Date(delayedRegistration+"Z");
			const closingRegistration_at=new Date(openingRegistration_at);
			if(durationRegistration.period=="h") {closingRegistration_at.setUTCDate(closingRegistration_at.getUTCHours() + durationRegistration.count);}
			if(durationRegistration.period=="d") {closingRegistration_at.setUTCDate(closingRegistration_at.getUTCDate() + durationRegistration.count);}
			if(durationRegistration.period=="w") {closingRegistration_at.setUTCDate(closingRegistration_at.getUTCDate() + durationRegistration.count*7);}
			
			const openingVote_at=openVoting_at=="immediate"? closingRegistration_at : new Date(delayedVoting+"Z");
			const closingVote_at=new Date(openingVote_at);
			if(durationVoting.period=="h") {closingVote_at.setUTCDate(closingVote_at.getUTCHours() + durationVoting.count);}
			if(durationVoting.period=="d") {closingVote_at.setUTCDate(closingVote_at.getUTCDate() + durationVoting.count);}
			if(durationVoting.period=="w") {closingVote_at.setUTCDate(closingVote_at.getUTCDate() + durationVoting.count*7);}

			srv_publishBallot({
				uid: props.ballot.uid,
				openingRegistration_at: openingRegistration_at.toISOString(),
				closingRegistration_at: closingRegistration_at.toISOString(),
				openingVote_at: openingVote_at.toISOString(),
				closingVote_at: closingVote_at.toISOString(),
				aCreds: [credsRequirement]
			})
			.then(_data => {
				if(_data.data==null) {
					throw _data;
				}
				toast.success("Ballot "+currentBallot.name+" is now published");
				props.onClose();
			})
			.catch(err => {
				toast.error("Could not publish ballot ("+err.message+")");
				props.onClose();
			})

		}
	}

	const renderConditions = ( )=> {
		return (
			<>
				<div>
					<label className={styles.prop}>
						Creds requirement
					</label>

					<select className={styles.select}
						onChange={(_e)=> setCredsRequirement(_e.target.value) }
					>
						<option value="none" >None</option>
						<option value="proof_of_fund" >Proof of Funds</option>
					</select>
				</div>
			</>
		)
	}

	const renderRegistrationTimes = ( )=> {
		return (
			<>
				<div>
					<label className={styles.prop}>
						Open registration
					</label>

					<select className={styles.select}
						onChange={(_e)=> setOpenRegistration_at(_e.target.value) }
					>
						<option value="now" >Now</option>
						<option value="delayed" >Delayed</option>
					</select>

					{openRegistration_at=="now"? "":
					<input
						type="datetime-local"
						value={delayedRegistration}
						onChange={(e) => setDelayedRegistration(e.target.value)}
						className="border rounded px-3 py-2"
					/>
					}

				</div>

				<div>
					<label className={styles.prop}>
						Duration of registration
					</label>

					<select className={styles.select}
						onChange={(_e)=> setDurationRegistration({
							count: parseInt(_e.target.value),
							period: durationRegistration.period
						})}
					>
						{aHours.map ((_h, _i) => {
							return (<option key = {_i} value={_h} selected={durationRegistration.count === _h}>{_h}</option>)})
						}
					</select>
						&nbsp;
					<select className={styles.select}
						onChange={(_e)=> setDurationRegistration({
							count: durationRegistration.count,
							period: _e.target.value
						})}
					>
						<option value="h" selected={durationRegistration.period === "h"}>Hour(s)</option>
						<option value="d" selected={durationRegistration.period === "d"}>Day(s)</option>
						<option value="w" selected={durationRegistration.period === "w"}>Week(s)</option>
					</select>

				</div>
							
			</>
		)
	}


	const renderVotingTimes = ( )=> {
		return (
			<>
				<div>
					<label className={styles.prop}>
						Open voting
					</label>

					<select className={styles.select}
						onChange={(_e)=> setOpenVoting_at(_e.target.value) }
					>
						<option value="immediate" >At registration closing</option>
						<option value="delayed" >Delayed</option>
					</select>

					{openVoting_at=="immediate"? "":
					<input
						type="datetime-local"
						value={delayedVoting}
						onChange={(e) => setDelayedVoting(e.target.value)}
						className="border rounded px-3 py-2"
					/>
					}

				</div>

				<div>
					<label className={styles.prop}>
						Duration of Voting period
					</label>

					<select className={styles.select}
						onChange={(_e)=> setDurationVoting({
							count: parseInt(_e.target.value),
							period: durationVoting.period
						})}
					>
						{aHours.map ((_h, _i) => {
							return (<option key = {_i} value={_h} selected={durationVoting.count === _h}>{_h}</option>)})
						}
					</select>
						&nbsp;
					<select className={styles.select}
						onChange={(_e)=> setDurationVoting({
							count: durationVoting.count,
							period: _e.target.value
						})}
					>
						<option value="h" selected={durationVoting.period === "h"}>Hour(s)</option>
						<option value="d" selected={durationVoting.period === "d"}>Day(s)</option>
						<option value="w" selected={durationVoting.period === "w"}>Week(s)</option>
					</select>

				</div>					
			</>
		)
	}

	const renderPublishBallot = ( ) => {
		return (
			<>
				{props.validityCheck?.isValid? "" : 
				<>
					<h4>Validity checks</h4>
					<div className={styles.error}>&nbsp; &nbsp; {props.validityCheck.error}</div>
				</>
				}

				<div className={props.validityCheck?.isValid? "" : styles.hidden}>
					<h4>Conditions</h4>
					{renderConditions()}

					<h4>Opening and closing times</h4>
					{renderRegistrationTimes()}
					<br />
					{renderVotingTimes()}
				</div>
			</>
		)
	}

	return (
		<>
			<Dialog 
				isVisible = {props.isVisible}
				title = {props.ballot? "Publish Ballot " + props.ballot.name: ""}
				message = ""
				form = {renderPublishBallot()}
				type = "form"
				textCancel = {props.validityCheck?.isValid? "Cancel" : "Close"}
				textOK = "Publish"
				onClose = {( ) => props.onClose()}
				onUpdate = {props.validityCheck?.isValid? (_name) => async_publishBallot(_name) : null}
			/>

			<ToastContainer />				
		</>
  );
};

export default DialogPublishBallot;