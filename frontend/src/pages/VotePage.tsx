import React, { useEffect, useState } from "react";
import { getCandidates, voteCandidate, unvoteUser, whoAmIVoting } from "../api";
import { User, Candidate } from "../types";
import "./VotePage.css";

type VotePageProps = {
  user: User;
};

export default function VotePage({ user }: VotePageProps): React.ReactElement {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  useEffect(() => {
    refreshCandidatesAndVote();
  }, []);

  async function refreshCandidatesAndVote() {
    try {
      const data = await getCandidates();
      setCandidates(data.candidates || []);

      const who = await whoAmIVoting({
        name: user.name,
        surname: user.surname,
        class_name: user.class_name,
      });

      if (who.voting_for) {
        setSelectedCandidate(`${who.voting_for.name}__${who.voting_for.surname}__${who.voting_for.class}`);
      } else {
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function candidateKey(c: Candidate) {
    return `${c.name}__${c.surname}__${c.class}`;
  }

  async function submitVote() {
    if (!selectedCandidate) return alert("Select a candidate first");
    const [cname, csurname, cclass] = selectedCandidate.split("__");
    try {
      await voteCandidate({
        user_name: user.name,
        user_surname: user.surname,
        user_class: user.class_name,
        candidate_name: cname,
        candidate_surname: csurname,
        candidate_class: cclass,
      });
      alert("Vote submitted successfully");
    } catch (err) {
      console.error(err);
      alert("Vote failed");
    }
  }

  async function handleUnvote() {
    try {
      await unvoteUser({ name: user.name, surname: user.surname, class_name: user.class_name });
      setSelectedCandidate(null);
      alert("Vote removed successfully");
    } catch (err) {
      console.error(err);
      alert("Unvote failed");
    }
  }

  return (
    <div className="vote-page">
      <h2 className="page-title">Cast Your Vote</h2>
      <div className="candidates-list">
        {candidates.length === 0 && (
          <div className="empty-state">No candidates available at this time</div>
        )}
        {candidates.map((c) => (
          <div
            key={candidateKey(c)}
            className={`candidate-card ${selectedCandidate === candidateKey(c) ? "selected" : ""}`}
            onClick={() => setSelectedCandidate(candidateKey(c))}
          >
            <div className="candidate-radio">
              <input
                type="radio"
                name="candidate"
                checked={selectedCandidate === candidateKey(c)}
                onChange={() => setSelectedCandidate(candidateKey(c))}
              />
            </div>
            <div className="candidate-info">
              <div className="candidate-name">
                {c.name} {c.surname}
              </div>
              <div className="candidate-class">{c.class}</div>
              <div className="candidate-postulates">{c.postulates}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="vote-actions">
        <button onClick={submitVote} className="btn btn-primary">
          Submit Vote
        </button>
        <button onClick={handleUnvote} className="btn btn-secondary">
          Remove Vote
        </button>
      </div>
    </div>
  );
}
