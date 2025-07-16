// src/pages/QuestionsPage.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ToastContainer, toast } from 'react-toastify';
import BottomNav from '../components/BottomNav';

import {  srv_getBallot, srv_patchBallot } from '../utils/rpc_ballot';

import styles from '../styles/Base.module.css';

const useQuery = () => {
	return new URLSearchParams(useLocation().search);
}

export default function QuestionsPage() {
	const [ballot, setBallot] = useState(null);
	const navigate = useNavigate();

	const query = useQuery();
	const ballotId = query.get('BallotId');

	useEffect(() => {
		// Load ballot with questions via API
		async function _async_load(_uid) {
			const _data = await srv_getBallot({
				uid: _uid
			});
			setBallot(_data.data);
		}

		if(ballotId && ballot==null) {
			_async_load(ballotId);
		}
	}, [ballot, ballotId]);


  	return (
		<div className={styles.pageContainer}>
			<h1 className={styles.title}> Questions for ballot <b>{ballot?.name}</b></h1>
			<a 
				onClick = {( ) => {	
				navigate("/ballots");
				}
			}
			>← Back to Ballots</a>

			<div className={styles.container}>
				<div className={styles.section}>

				{
					ballot== null  ? (
						<p>No ballot found</p>
				) : 
					ballot.questions==null || ballot.questions.length==0 ? 
					(
						<p>No question found</p>
					)
				:
				<ul>
				{ballot?.questions?.map((q, idx) => (
					<li key={q.id}>
					{idx + 1}. {q.text}
					<button>Edit</button>
					<button>Delete</button>
					</li>
				))}
				</ul>
				}
				</div>

				<button className={styles.button}>Add Question</button>

			</div>

		<BottomNav />
		<ToastContainer />
		</div>
  );
}
