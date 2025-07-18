// src/pages/QuestionsPage.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dialog from '../components/dialog.jsx';

import { ToastContainer, toast } from 'react-toastify';
import BottomNav from '../components/BottomNav';

import {  srv_getBallot, srv_patchBallot, srv_postCreateQuestion } from '../utils/rpc_ballot';

import styles from '../styles/Base.module.css';

const useQuery = () => {
	return new URLSearchParams(useLocation().search);
}

const aQuestionTypes = [
	{type: "bool", text: "Yes or No"}, 
	{type: "select", text: "Single choice"}, 
	{type: "mcq", text: "Multiple Choice"} 
];

export default function QuestionsPage() {
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [ballot, setBallot] = useState(null);
	const [question, setQuestion] = useState(null);
	const navigate = useNavigate();

	const query = useQuery();
	const ballotId = query.get('BallotId');
	
	useEffect(() => {
		// Load ballot with questions via API

		if(ballotId && ballot==null) {
			_async_load(ballotId);
		}
	}, [ballot, ballotId]);

	const _async_load = async(_uid) => {
		try {
			const _data = await srv_getBallot({
				uid: _uid
			});
			setBallot(_data.data);
			return _data;
		}
		catch(err) {return null}
	}

	const async_createQuestion = async (_data) => {
		setIsCreateDialogOpen(false);

		// create ballot with user as admin
		srv_postCreateQuestion({
			uid_ballot: ballotId, 
			title: question.title,			
			rich_text: question.rich_text,
			link: question.link,			
			type: question.type,			
		})
			.then(_data => {
				if(_data.data==null) {
					throw _data;
				}

				toast.success("Question "+_data+" was created");

				// now load this ballot
				async_loadBallot();
			}) 
			.catch(err => {
				toast.error("Could not create question ("+err.message+")");
			})
	}

	const updateQuestion = (_data) => {
		let objQ= question? {...question} : {};
		for (const key in _data) {
			objQ[key]=_data[key]
		}
		setQuestion(objQ);
	}

	const renderEditQuestion = (iQuestion) => {
//    image: {type: String, required: false},                          // image url associated to Question

		return (
			<>
				<div>
					<label className={styles.prop}>
						Title
					</label>

					<input
						type="text"
						value={question? question.title: ""}
						onChange={(e) => updateQuestion({title: e.target.value})}
						className={styles.input}
						placeholder={"Compulsory"}
					/>
				</div>
				
				<div>
					<label className={styles.prop}>
						URL link
					</label>

					<input
						type="text"
						value={question? question.link: ""}
						onChange={(e) => updateQuestion({link: e.target.value})}
						className={styles.input}
						placeholder={"Optional, add link here"}
					/>
				</div>

				<div>
					<label className={styles.prop}>
						Description
					</label>

					<textarea
						rows = "4"
						value={question? question.rich_text: ""}
						onChange={(e) => updateQuestion({rich_text: e.target.value})}
						className={styles.input}
						placeholder={"Describe your question here..."}
					/>
				</div>

				<div>
					<label className={styles.prop}>
						Type of answers
					</label>

					<select
						value={question? question.type: "select"}
						onChange={(e) => {
							updateQuestion({type: e.target.value})
						}}
						className={styles.input}
						>
						{aQuestionTypes.map((item, index) => {
							return (
								<option key = {index} value={item.type} >{item.text}</option>
							)
						})}
					</select>
				</div>

				{iQuestion !=null?
					<div>
						<label className={styles.prop}>
							Type of choices
						</label>

						<select
							value={question? question.aChoice: ""}
							onChange={(e) => {
								updateQuestion({aChoice: e.target.value})
							}}
							className={styles.input}
							>
							{aQuestionTypes.map((item, index) => {
								return (
									<option key = {index} value={item.type} >{item.text}</option>
								)
							})}
						</select>
					</div>
				:""}
			</>
		)
	}

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
					ballot.aQuestion==null || ballot.aQuestion.length==0 ? 
					(
						<p>No question found</p>
					)
				:

				<table className={styles.tableBallot}>

					<tbody>
					{ballot?.aQuestion?.map((q, idx) => (
							<tr key={q.uid}>
								<td >{idx+1}.  {q.title}</td>
								
								<td width = "48">
									<img src="icons/icons8-edit-24.png" width = "32" height = "32"  
									onClick={() => {
										setQuestion(q);
										setIsEditDialogOpen(true);
									}}
									/>
								</td>

								<td width = "48">
									<img src="icons/icons8-preview-50.png" width = "32" height = "32"  
									onClick={() => {
										setQuestion(q);
									}}
									/>
								</td>

								<td width = "48">
									<img src="icons/icons8-delete-30.png" width = "32" height = "32"  
									onClick={() => {
										setQuestion(q);
									}}
									/>
								</td>
							</tr>
					))}
					</tbody>
				</table>
				}
				</div>

				<button 
					className={styles.button} 
					onClick = {( )=> {
						setIsCreateDialogOpen(true);
						setQuestion({
							title: null,
							type: "select"
						});
					}
					}>
					Add Question
				</button>

			</div>

			<Dialog 
					isVisible = {isCreateDialogOpen}
					title = "Add a new Question"
					message = ""
					form = {renderEditQuestion(null)}
					type = "form"
					textCancel = "Cancel"
					textOK = "Create"
					onClose = {( ) => setIsCreateDialogOpen(false)}
					onUpdate = {(_data) => async_createQuestion(_data)}
			/>

		<BottomNav />
		<ToastContainer />
		</div>
  );
}
