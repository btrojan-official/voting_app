import React, { useEffect, useState } from "react";
import { getClasses } from "./api";
import { User, ViewType } from "./types";
import LoginPage from "./pages/LoginPage";
import VotePage from "./pages/VotePage";
import CandidatePage from "./pages/CandidatePage";
import StatsPage from "./pages/StatsPage";
import Navigation from "./components/Navigation";
import Layout from "./components/Layout";
import "./styles.css";
import "./App.css";

export default function App(): React.ReactElement {
  const [classes, setClasses] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("voting_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [view, setView] = useState<ViewType>("vote");

  useEffect(() => {
    getClasses()
      .then((res) => setClasses(res.classes || []))
      .catch((e) => console.error(e));
  }, []);

  function handleLogin(newUser: User) {
    setUser(newUser);
    setView("vote");
  }

  function handleLogout() {
    localStorage.removeItem("voting_user");
    setUser(null);
    setView("vote");
  }

  if (!user) {
    return <LoginPage classes={classes} onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <Navigation user={user} currentView={view} onViewChange={setView} onLogout={handleLogout} />
      <Layout>
        {view === "vote" && <VotePage user={user} />}
        {view === "candidate" && <CandidatePage user={user} />}
        {view === "stats" && <StatsPage />}
      </Layout>
    </div>
  );
}
