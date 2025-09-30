/*
Micro Notes — Notes Page (Container)
------------------------------------

Top-level page that manages:
- Authentication (login/signup/logout) using UsersAPI
- Note CRUD orchestration using NotesAPI
- Token lifecycle (read/set/clear via api.js helpers)
- UI composition: <NoteForm/> for create, <NoteList/> for list/update/delete

Key behaviors & notes
- On mount, if a token exists, eagerly fetches `/auth/me` and `/notes` to hydrate UI.
- Controlled inputs for email/password (dev-friendly defaults for quick testing).
- Errors from API are surfaced in a single `msg` banner; each action clears it first.
- Create: optimistic-style prepend (`[n, ...notes]`) after server returns the created note.
- Update: immutable map-replace by id; Delete: immutable filter by id.
- Logout: clears token + resets user/notes state; the component re-renders to auth form.
- Response ordering is preserved server-side; we still manually keep newest-first on create.

Typical usage
-------------
Rendered by <App/> as the main screen. Assumes CSS utility classes exist
(e.g., .container, .header, .btn, .card, .error, etc.).
*/

import React, { useEffect, useState } from "react";
import { UsersAPI, NotesAPI, setToken, getToken, clearToken } from "../api/api";
import NoteForm from "../components/NoteForm";
import NoteList from "../components/NoteList";

export default function NotesPage() {
  const [me, setMe] = useState(null); // why: null = unauthenticated; object = minimal user profile
  const [notes, setNotes] = useState([]); // why: single source of truth for list view
  const [msg, setMsg] = useState(""); // why: simple global error surface

  // NEW: controlled inputs for auth form
  const [email, setEmail] = useState("harry@example.com"); // why: seeded defaults speed manual testing
  const [password, setPassword] = useState("harry123");

  useEffect(() => {
    // why: cold-start hydration if a token is already present (e.g., after refresh)
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
  }, []); // why: run once on mount

  async function handleLogin(e) {
    e.preventDefault();
    setMsg(""); // why: clear any stale error before a new attempt
    try {
      const res = await UsersAPI.login(email.trim(), password);
      setToken(res.access_token); // why: persist token for subsequent requests and reloads
      const m = await UsersAPI.me(); // why: confirm identity and hydrate header
      setMe(m);
      const list = await NotesAPI.list(); // why: fetch user-scoped notes after auth
      setNotes(list);
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("");
    try {
      await UsersAPI.signup(email.trim(), password); // why: idempotent server-side (409 if exists)
      const res = await UsersAPI.login(email.trim(), password); // why: auto-login after signup
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
    // why: remove auth and reset local UI state; server has no session to clear (JWT)
    clearToken();
    setMe(null);
    setNotes([]);
  }

  async function addNote(title, body) {
    setMsg("");
    try {
      const n = await NotesAPI.create(title, body);
      setNotes([n, ...notes]); // why: prepend newest for a snappy UX without reloading all
      return true; // why: allow child form to clear inputs on success
    } catch (err) {
      setMsg(err.message);
      return false; // why: child may keep inputs for user to fix/retry
    }
  }

  async function updateNote(id, data) {
    setMsg("");
    try {
      const u = await NotesAPI.update(id, data);
      // why: immutable update preserves referential integrity for React reconciliation
      setNotes(notes.map((n) => (n.id === id ? u : n)));
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function deleteNote(id) {
    setMsg("");
    try {
      await NotesAPI.remove(id);
      setNotes(notes.filter((n) => n.id !== id)); // why: immutable removal
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
                onChange={(e) => setEmail(e.target.value)} // why: keep controlled for deterministic tests
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
            {/* why: isolate creation UX; child calls `onAdd` and awaits boolean success */}
            <NoteForm onAdd={addNote} />
            <div className="space" />
            {/* why: list updates are delegated to parent to keep single source of truth */}
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
            <div className="error">Error: {msg}</div>{" "}
            {/* why: simple global error banner */}
          </>
        )}
      </div>
    </div>
  );
}
