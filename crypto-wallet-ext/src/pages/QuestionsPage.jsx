// src/pages/QuestionsPage.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dialog from '../components/dialog.jsx';
import PreviewQuestionPanel from '../components/previewQuestion.jsx';

import { ToastContainer, toast } from 'react-toastify';
import BottomNav from '../components/BottomNav';

import {  srv_getBallot, srv_patchQuestion, srv_postCreateQuestion, srv_deleteQuestion, srv_linkQuestion, srv_unlinkQuestion } from '../utils/rpc_ballot';

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
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [editOption, setEditOption] = useState("option_overview");
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
			if(_uid!=null) {
			const _data = await srv_getBallot({
					uid: _uid
				});
				setBallot(_data.data);
				return _data;
			}
		}
		catch(err) {return null}
	}

	const async_createQuestion = async (_data) => {
		try {
			setIsCreateDialogOpen(false);

			// create Question
			const _dataQ= await srv_postCreateQuestion({
				title: question.title,			
				rich_text: question.rich_text,
				link: question.link,			
				type: question.type,			
			})

			if(!_dataQ.data) {throw _dataQ}

			// link to Ballot
			const dataB= await srv_linkQuestion({
				uid_ballot: ballotId, 
				uid_question: _dataQ.data.uid, 
			})

			toast.success("Question "+_data+" was created");

			// now load this ballot
			_async_load(ballotId);
		}
		catch(err) {
			toast.error("Could not create question ("+err.message+")");
		}
	}

	const async_deleteQuestion = async (_uid) => {
		try {
			const dataB= await srv_unlinkQuestion({
				uid_ballot: ballotId, 
				uid_question: _uid, 
			})

			// delete Question
			const _dataQ= await srv_deleteQuestion({
				uid_question: _uid, 
			})

			toast.success("Question was remove from Ballot");

			// now load this ballot
			_async_load(ballotId);
		}
		catch(err) {
			toast.error("Could not delete question ("+err.message+")");
		}
	}

	const async_updateQuestion = async (_uid) => {
		try {
			const _dataQ= await srv_patchQuestion({
				uid_question: _uid, 
				title: question.title,			
				rich_text: question.rich_text,
				link: question.link,			
				type: question.type,
				aChoice: JSON.stringify(question.aChoice)
			})

			toast.success("Question was updated");

			// now load this ballot
			_async_load(ballotId);
		}
		catch(err) {
			toast.error("Could not update question ("+err.message+")");
		}
	}

	const updateQuestionPropVal = (_data) => {
		let objQ= question? {...question} : {};
		for (const key in _data) {
			objQ[key]=_data[key]
		}
		setQuestion(objQ);
	}

	const updateAnswerPropVal = (_iChoice, _obj) => {
		let objQ= question? {...question} : {};
		for (const key in _obj) {
			objQ.aChoice[_iChoice][key] = _obj[key]
		}
		setQuestion(objQ);
	}

	const renderCreateQuestion = (iQuestion) => {
		return (
			<>
				<div>
					<label className={styles.prop}>
						Title
					</label>

					<input
						type="text"
						value={question? question.title: ""}
						onChange={(e) => updateQuestionPropVal({title: e.target.value})}
						className={styles.input}
						placeholder={"Compulsory"}
					/>
				</div>
				
				<div>
					<label className={styles.prop}>
						Type of answers
					</label>

					<select
						value={question? question.type: "select"}
						onChange={(e) => {
							updateQuestionPropVal({type: e.target.value})
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

			</>
		)
	}

	
	const renderEditQuestion = (iQuestion) => {
//    image: {type: String, required: false},                          // image url associated to Question

		return (
			<div className={styles.editQuestionContent}>
				<div className={styles.panelSelect}>
					<a className={editOption=="option_overview"? styles.bold_underlined: ""} onClick = {( )=> {setEditOption("option_overview")}} href="#">Overview</a> 
					&nbsp; - &nbsp;
					<a className={editOption=="option_question"? styles.bold_underlined: ""} onClick = {( )=> {setEditOption("option_question")}} href="#">Question</a> 
					&nbsp; - &nbsp;
					<a className={editOption=="option_answers"? styles.bold_underlined: ""} onClick = {( )=> {setEditOption("option_answers")}} href="#">Possible answers</a> 
				</div>

				{editOption=="option_overview"?
				<>
					<div>
						<label className={styles.prop}>
							Title
						</label>

						<input
							type="text"
							value={question? question.title: ""}
							onChange={(e) => updateQuestionPropVal({title: e.target.value})}
							className={styles.input}
							placeholder={"Compulsory"}
						/>
					</div>

					<div>
						<label className={styles.prop}>
							Type of answers
						</label>

						<select
							value={question? question.type: "select"}
							onChange={(e) => {
								updateQuestionPropVal({type: e.target.value})
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
				</> 
				:""}

				{editOption=="option_question"?
				<>

					<div>
						<label className={styles.prop}>
							URL link
						</label>

						<input
							type="text"
							value={question? question.link: ""}
							onChange={(e) => updateQuestionPropVal({link: e.target.value})}
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
							onChange={(e) => updateQuestionPropVal({rich_text: e.target.value})}
							className={styles.input}
							placeholder={"Describe your question here..."}
						/>
					</div>
				</>
				:""}
				
				{editOption=="option_answers"?
					<>
						<h3 >
							List of possible answers
						</h3>

						<div>
							{question?.aChoice?.map((item, index) => {
								return (
									<div key = {index}>
										<div >
											<img src="icons/icons8-delete-30.png" width = "16" height = "16"
												onClick={() => {
													let tmpQ = {...question};
													tmpQ.aChoice.splice(index, 1);
													setQuestion(tmpQ);
												}}
											/>
											&nbsp;
											Choice {index+1}
										</div>

										<label className={styles.prop}  >Text</label>
										<input 
										type="text"
											value={item.text? item.text: ""}
											onChange={(e) => updateAnswerPropVal(index, {text: e.target.value})}
											className={styles.input}
											placeholder={"Text displayed to user"}
										/>
										<br />
										<label className={styles.prop}  >Value</label>
										<input 
										type="text"
											value={item.value? item.value: ""}
											onChange={(e) => updateAnswerPropVal(index, {value: e.target.value})}
											className={styles.input}
											placeholder={"Value stored"}
										/>
									</div>
								)
							})}

							{question?.type!=="bool"?
								<div className={styles.button} onClick={()=> {
									let tmpQ = {...question};
									tmpQ.aChoice.push({text: "", value: null});
									setQuestion(tmpQ);
								}}> 
									Add possible answer...
								</div>
							:""}
						</div>
					</>
				:""}
			</div>
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
					{ballot?.aQuestionInFull?.map((q, idx) => (
							<tr key={q.uid}>
								<td >{idx+1}. [{q.type}] {q.title}</td>
								<td>
									{ballot.aQuestionInFull && ballot.aQuestionInFull[idx].aChoice && ballot.aQuestionInFull[idx].aChoice.length>0?
									<select>
										 {ballot.aQuestionInFull[idx].aChoice.map((choice, iChoice) => (
											<option key = {iChoice} value = {choice.value}>{choice.text}</option>
										))}
									</select>
									: 
										<span className={styles.italic}>in progress</span>
									}
								</td>
								
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
										setIsPreviewOpen(!isPreviewOpen)
									}}
									/>
								</td>

								<td width = "48">
									<img src="icons/icons8-delete-30.png" width = "32" height = "32"  
									onClick={() => {
										setQuestion(q);
										async_deleteQuestion(q.uid).then(( )=> {
											setQuestion(null);
										})
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
							title: "",
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
					message = {null}
					form = {renderCreateQuestion(null)}
					type = "form"
					textCancel = "Cancel"
					textOK = "Create"
					onClose = {( ) => setIsCreateDialogOpen(false)}
					onUpdate = {(_data) => async_createQuestion(_data)}
			/>

			<Dialog 
					isVisible = {isEditDialogOpen}
					title = "Edit Question Content"
					message = {null}
					form = {renderEditQuestion(null)}
					type = "form"
					textCancel = "Cancel"
					textOK = "Save"
					onClose = {( ) => setIsEditDialogOpen(false)}
					onUpdate = {(_data) => async_updateQuestion(question?.uid)}
			/>

			<Dialog 
					isVisible = {isPreviewOpen}
					title = {question?.title}
					form = {<PreviewQuestionPanel 
								question = {isPreviewOpen? question : null}
							/>}
					type = "form"
					textCancel = "close"
					textOK = {null}
					onClose = {( ) => setIsPreviewOpen(false)}
					onUpdate = {null}
			/>

			

		<BottomNav />
		<ToastContainer />
		</div>
  );
}
