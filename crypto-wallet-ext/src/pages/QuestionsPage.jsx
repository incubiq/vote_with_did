// src/pages/QuestionsPage.jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function QuestionsPage() {
  const { ballotId } = useParams();
  const [ballot, setBallot] = useState(null);

  useEffect(() => {
    // Load ballot with questions via API
    async function load() {
      const data = await srv_getBallotById(ballotId);
      setBallot(data);
    }
    load();
  }, [ballotId]);

  return (
    <div>
      <h1>Questions for "{ballot?.name}"</h1>
      <ul>
        {ballot?.questions.map((q, idx) => (
          <li key={q.id}>
            {idx + 1}. {q.text}
            <button>Edit</button>
            <button>Delete</button>
          </li>
        ))}
      </ul>
      <button>Add Question</button>
      <br />
      <a href="/ballots">← Back to Ballots</a>
    </div>
  );
}
