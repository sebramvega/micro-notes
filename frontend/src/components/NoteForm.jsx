/*
Micro Notes — Note Form (Create)
--------------------------------

Controlled form for creating a new note. Emits `{title, body}` via `onAdd`
and clears inputs on successful creation.

Key behaviors & notes
- Uses local state so typing doesn’t mutate parent state until submit.
- Trims whitespace; prevents empty submissions.
- Awaits `onAdd(...)` and only clears fields when it returns `true`.
- Minimal markup for easy testing with RTL.

Typical usage
-------------
    <NoteForm onAdd={(title, body) => NotesAPI.create(title, body)} />
*/

import React, { useState } from "react";

export default function NoteForm({ onAdd }) {
  const [title, setTitle] = useState(""); // why: controlled input for deterministic tests
  const [body, setBody] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return; // why: client-side guard against blank notes
    const ok = await onAdd(title.trim(), body.trim()); // why: parent decides how to create + handle errors
    if (ok) {
      setTitle(""); // why: clear only on confirmed success
      setBody("");
    }
  }

  return (
    <form className="row" onSubmit={submit}>
      <input
        className="input"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="input"
        placeholder="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button className="btn" type="submit">
        Add
      </button>
    </form>
  );
}
