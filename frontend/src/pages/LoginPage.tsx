import React, { useState } from "react";
import { addUser } from "../api";
import { User } from "../types";
import "./LoginPage.css";

type LoginPageProps = {
  classes: string[];
  onLogin: (user: User) => void;
};

export default function LoginPage({ classes, onLogin }: LoginPageProps): React.ReactElement {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [className, setClassName] = useState("");

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name || !surname || !className) return alert("Please fill all fields");

    const newUser = { name, surname, class_name: className };
    try {
      await addUser({ name, surname, class_name: className });
    } catch (err) {
      console.warn("addUser error (may already exist)", err);
    }

    localStorage.setItem("voting_user", JSON.stringify(newUser));
    onLogin(newUser);
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Voting System</h1>
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label>Surname</label>
            <input 
              value={surname} 
              onChange={(e) => setSurname(e.target.value)} 
              placeholder="Enter your surname"
            />
          </div>
          <div className="form-group">
            <label>Class</label>
            <select value={className} onChange={(e) => setClassName(e.target.value)}>
              <option value="">Select your class</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Enter</button>
        </form>
      </div>
    </div>
  );
}
