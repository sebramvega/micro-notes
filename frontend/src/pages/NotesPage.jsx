import React, { useEffect, useState } from "react";
import { UsersAPI, NotesAPI, setToken, getToken, clearToken } from "../api/api";
import NoteForm from "../components/NoteForm";
import NoteList from "../components/NoteList";

export default function NotesPage() {
  const [me, setMe] = useState(null);
  const [notes, setNotes] = useState([]);
  const [msg, setMsg] = useState("");

  // NEW: controlled inputs for auth form
  const [email, setEmail] = useState("harry@example.com");
  const [password, setPassword] = useState("harry123");

  useEffect(() => {
    async function init() {
      if (!getToken()) return;
      try {
        const m = await UsersAPI.me();
        setMe(m);
        const list = await NotesAPI.list();
        setNotes(list);
      } catch (err) {
        setMsg(err.message);
      }
    }
    init();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await UsersAPI.login(email.trim(), password);
      setToken(res.access_token);
      const m = await UsersAPI.me();
      setMe(m);
      const list = await NotesAPI.list();
      setNotes(list);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("");
    try {
      await UsersAPI.signup(email.trim(), password);
      const res = await UsersAPI.login(email.trim(), password);
      setToken(res.access_token);
      const m = await UsersAPI.me();
      setMe(m);
      const list = await NotesAPI.list();
      setNotes(list);
    } catch (err) {
      setMsg(err.message);
    }
  }

  function handleLogout() {
    clearToken();
    setMe(null);
    setNotes([]);
  }

  async function addNote(title, body) {
    setMsg("");
    try {
      const n = await NotesAPI.create(title, body);
      setNotes([n, ...notes]);
      return true;
    } catch (err) {
      setMsg(err.message);
      return false;
    }
  }

  async function updateNote(id, data) {
    setMsg("");
    try {
      const u = await NotesAPI.update(id, data);
      setNotes(notes.map((n) => (n.id === id ? u : n)));
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function deleteNote(id) {
    setMsg("");
    try {
      await NotesAPI.remove(id);
      setNotes(notes.filter((n) => n.id !== id));
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h2>📝 Micro Notes</h2>
        <div className="hstack">
          {me && (
            <>
              <span className="muted">Signed in as {me.email}</span>
              <button className="btn secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        {!me ? (
          <>
            <h3>Log in or sign up</h3>
            <div className="space" />
            <form className="row" onSubmit={handleLogin}>
              <input
                className="input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button className="btn" type="submit">
                Log in
              </button>
              <button className="btn" type="button" onClick={handleSignup}>
                Sign up
              </button>
            </form>
          </>
        ) : (
          <>
            <NoteForm onAdd={addNote} />
            <div className="space" />
            <NoteList
              items={notes}
              onUpdate={updateNote}
              onDelete={deleteNote}
            />
          </>
        )}

        {msg && (
          <>
            <div className="space" />
            <div className="error">Error: {msg}</div>
          </>
        )}
      </div>
    </div>
  );
}
