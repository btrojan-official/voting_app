import React, { useEffect, useState } from "react";
import "./App.css";
import {
  getClasses,
  addUser,
  getCandidates,
  voteCandidate,
  unvoteUser,
  whoAmIVoting,
  isCandidate,
  addCandidate,
  removeCandidate,
  getStats,
} from "./api";

type User = { name: string; surname: string; class_name: string };
type Candidate = {
  name: string;
  surname: string;
  postulates: string;
  class: string;
};

export default function App(): React.ReactElement {
  const [classes, setClasses] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("voting_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [view, setView] = useState<"home" | "vote" | "candidate" | "stats">("home");

  // login form
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [className, setClassName] = useState("");

  // vote state
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [votedCandidateId, setVotedCandidateId] = useState<string | null>(null);

  // candidate view state
  const [postulates, setPostulates] = useState("");
  const [amCandidate, setAmCandidate] = useState<boolean>(false);

  // stats
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    getClasses()
      .then((res) => setClasses(res.classes || []))
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    if (user && view === "vote") {
      refreshCandidatesAndVote();
    }
    if (user && view === "candidate") {
      checkCandidate();
    }
    if (user && view === "stats") {
      loadStats();
    }
  }, [user, view]);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name || !surname || !className) return alert("Please fill all fields");

    const newUser = { name, surname, class_name: className };
    try {
      await addUser({ name, surname, class_name: className });
    } catch (err) {
      // backend returns 400 if user exists; that's fine
      console.warn("addUser error (may already exist)", err);
    }

    setUser(newUser);
    localStorage.setItem("voting_user", JSON.stringify(newUser));
    setView("vote");
  }

  async function refreshCandidatesAndVote() {
    try {
      const data = await getCandidates();
      setCandidates(data.candidates || []);

      // find who user is voting
      const who = await whoAmIVoting({
        name: user!.name,
        surname: user!.surname,
        class_name: user!.class_name,
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
    if (!user) return alert("Log in first");
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
      alert("Vote submitted");
    } catch (err) {
      console.error(err);
      alert("Vote failed");
    }
  }

  async function handleUnvote() {
    if (!user) return;
    try {
      await unvoteUser({ name: user.name, surname: user.surname, class_name: user.class_name });
      setSelectedCandidate(null);
      alert("Vote removed");
    } catch (err) {
      console.error(err);
      alert("Unvote failed");
    }
  }

  async function checkCandidate() {
    if (!user) return;
    try {
      const res = await isCandidate({ name: user.name, surname: user.surname, class_name: user.class_name });
      setAmCandidate(res.is_candidate);
      if (res.is_candidate) {
        // load postulates from candidates list
        const all = await getCandidates();
        const mine = all.candidates.find((c: Candidate) => c.name === user.name && c.surname === user.surname && c.class === user.class_name);
        setPostulates(mine ? mine.postulates : "");
      } else {
        setPostulates("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function submitCandidacy() {
    if (!user) return;
    try {
      await addCandidate({ name: user.name, surname: user.surname, class_name: user.class_name, postulates });
      setAmCandidate(true);
      alert("You are now a candidate");
    } catch (err) {
      console.error(err);
      alert("Failed to add candidate");
    }
  }

  async function resignCandidacy() {
    if (!user) return;
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

  async function loadStats() {
    try {
      const res = await getStats();
      setStats(res.stats || []);
    } catch (err) {
      console.error(err);
    }
  }

  function downloadStats() {
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!user) {
    return (
      <div className="App">
        <h2>Log in</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Name: </label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>Surname: </label>
            <input value={surname} onChange={(e) => setSurname(e.target.value)} />
          </div>
          <div>
            <label>Class: </label>
            <select value={className} onChange={(e) => setClassName(e.target.value)}>
              <option value="">-- choose class --</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="App">
      <h2>Welcome, {user.name} {user.surname} ({user.class_name})</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setView("vote")}>Vote</button>
        <button onClick={() => setView("candidate")}>Candidate</button>
        <button onClick={() => setView("stats")}>Stats</button>
        <button onClick={() => { localStorage.removeItem("voting_user"); setUser(null); setView("home"); }}>Logout</button>
      </div>

      {view === "vote" && (
        <div>
          <h3>Vote</h3>
          <div>
            {candidates.length === 0 && <div>No candidates</div>}
            {candidates.map((c) => (
              <div key={candidateKey(c)} style={{ padding: 6 }}>
                <label>
                  <input
                    type="radio"
                    name="candidate"
                    checked={selectedCandidate === candidateKey(c)}
                    onChange={() => setSelectedCandidate(candidateKey(c))}
                  />
                  {c.name} {c.surname} ({c.class}) — {c.postulates}
                </label>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={submitVote}>Submit</button>
            <button onClick={handleUnvote} style={{ marginLeft: 8 }}>
              Unvote
            </button>
          </div>
        </div>
      )}

      {view === "candidate" && (
        <div>
          <h3>Candidate</h3>
          {!amCandidate ? (
            <div>
              <label>Postulates:</label>
              <div>
                <textarea value={postulates} onChange={(e) => setPostulates(e.target.value)} rows={6} cols={50} />
              </div>
              <div>
                <button onClick={submitCandidacy}>Submit candidacy</button>
              </div>
            </div>
          ) : (
            <div>
              <label>Your postulates:</label>
              <div style={{ whiteSpace: "pre-wrap", border: "1px solid #ddd", padding: 8, marginTop: 6 }}>
                {postulates}
              </div>
              <div style={{ marginTop: 8 }}>
                <button onClick={resignCandidacy}>Resign from candidating</button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "stats" && (
        <div>
          <h3>Stats</h3>
          <div>
            <button onClick={loadStats}>Refresh</button>
            <button onClick={downloadStats} style={{ marginLeft: 8 }}>
              Download
            </button>
          </div>
          <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc" }}>Name</th>
                <th style={{ border: "1px solid #ccc" }}>Surname</th>
                <th style={{ border: "1px solid #ccc" }}>Grade</th>
                <th style={{ border: "1px solid #ccc" }}>Postulates</th>
                <th style={{ border: "1px solid #ccc" }}>Votes</th>
                <th style={{ border: "1px solid #ccc" }}>Votes per class</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={i}>
                  <td style={{ border: "1px solid #ccc" }}>{s.name}</td>
                  <td style={{ border: "1px solid #ccc" }}>{s.surname}</td>
                  <td style={{ border: "1px solid #ccc" }}>{s.grade}</td>
                  <td style={{ border: "1px solid #ccc" }}>{s.postulates}</td>
                  <td style={{ border: "1px solid #ccc" }}>{s.number_of_votes}</td>
                  <td style={{ border: "1px solid #ccc" }}>{JSON.stringify(s.number_of_votes_per_class)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
