import React, { useEffect, useState } from "react";
import { getStats } from "../api";
import { StatEntry } from "../types";
import "./StatsPage.css";

export default function StatsPage(): React.ReactElement {
  const [stats, setStats] = useState<StatEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const res = await getStats();
      setStats(res.stats || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }

  function downloadStats() {
    const blob = new Blob([JSON.stringify(stats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voting-stats.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="stats-page">
      <h2 className="page-title">Voting Statistics</h2>
      <div className="stats-actions">
        <button onClick={loadStats} className="btn btn-secondary" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button onClick={downloadStats} className="btn btn-primary" disabled={stats.length === 0}>
          Download JSON
        </button>
      </div>
      {stats.length === 0 ? (
        <div className="empty-state">No statistics available</div>
      ) : (
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Grade</th>
                <th>Postulates</th>
                <th>Total Votes</th>
                <th>Votes per Class</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td>{s.surname}</td>
                  <td>{s.grade}</td>
                  <td className="postulates-cell">{s.postulates}</td>
                  <td className="votes-cell">{s.number_of_votes}</td>
                  <td className="class-votes-cell">
                    {Object.entries(s.number_of_votes_per_class).map(([className, votes]) => (
                      <div key={className} className="class-vote-item">
                        <span className="class-name">{className}:</span>
                        <span className="vote-count">{votes}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
