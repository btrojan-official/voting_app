import React from "react";
import { User, ViewType } from "../types";
import "./Navigation.css";

type NavigationProps = {
  user: User;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
};

export default function Navigation({ user, currentView, onViewChange, onLogout }: NavigationProps): React.ReactElement {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h1>Voting System</h1>
          <div className="user-info">
            {user.name} {user.surname} <span className="user-class">({user.class_name})</span>
          </div>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentView === "vote" ? "active" : ""}`}
            onClick={() => onViewChange("vote")}
          >
            Vote
          </button>
          <button
            className={`nav-link ${currentView === "candidate" ? "active" : ""}`}
            onClick={() => onViewChange("candidate")}
          >
            Candidate
          </button>
          <button
            className={`nav-link ${currentView === "stats" ? "active" : ""}`}
            onClick={() => onViewChange("stats")}
          >
            Statistics
          </button>
          <button className="nav-link logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
