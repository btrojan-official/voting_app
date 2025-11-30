import React, { useEffect, useState } from "react";
import { isCandidate, getCandidates, addCandidate, removeCandidate } from "../api";
import { User, Candidate } from "../types";
import "./CandidatePage.css";

type CandidatePageProps = {
  user: User;
};

export default function CandidatePage({ user }: CandidatePageProps): React.ReactElement {
  const [postulates, setPostulates] = useState("");
  const [amCandidate, setAmCandidate] = useState<boolean>(false);

  useEffect(() => {
    checkCandidate();
  }, []);

  async function checkCandidate() {
    try {
      const res = await isCandidate({ name: user.name, surname: user.surname, class_name: user.class_name });
      setAmCandidate(res.is_candidate);
      if (res.is_candidate) {
        const all = await getCandidates();
        const mine = all.candidates.find(
          (c: Candidate) =>
            c.name === user.name && c.surname === user.surname && c.class === user.class_name
        );
        setPostulates(mine ? mine.postulates : "");
      } else {
        setPostulates("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function submitCandidacy() {
    if (!postulates.trim()) {
      return alert("Please enter your postulates");
    }
    try {
      await addCandidate({ name: user.name, surname: user.surname, class_name: user.class_name, postulates });
      setAmCandidate(true);
      alert("You are now a candidate!");
    } catch (err) {
      console.error(err);
      alert("Failed to add candidate");
    }
  }

  async function resignCandidacy() {
    if (!window.confirm("Are you sure you want to resign? This may remove votes.")) return;
    try {
      await removeCandidate({ name: user.name, surname: user.surname, class_name: user.class_name });
      setAmCandidate(false);
      setPostulates("");
      alert("You resigned from being a candidate");
    } catch (err) {
      console.error(err);
      alert("Failed to remove candidate");
    }
  }

  return (
    <div className="candidate-page">
      <h2 className="page-title">Candidate Management</h2>
      {!amCandidate ? (
        <div className="candidate-form">
          <div className="form-section">
            <label className="form-label">Your Postulates</label>
            <p className="form-description">
              Share your vision and what you plan to achieve if elected
            </p>
            <textarea
              value={postulates}
              onChange={(e) => setPostulates(e.target.value)}
              rows={8}
              className="postulates-textarea"
              placeholder="Enter your campaign postulates here..."
            />
          </div>
          <button onClick={submitCandidacy} className="btn btn-primary">
            Submit Candidacy
          </button>
        </div>
      ) : (
        <div className="candidate-display">
          <div className="status-badge">Active Candidate</div>
          <div className="postulates-display">
            <label className="form-label">Your Postulates:</label>
            <div className="postulates-content">{postulates}</div>
          </div>
          <button onClick={resignCandidacy} className="btn btn-danger">
            Resign from Candidacy
          </button>
        </div>
      )}
    </div>
  );
}
