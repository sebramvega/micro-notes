import React, { useState } from "react";

export default function NoteForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    const ok = await onAdd(title.trim(), body.trim());
    if (ok) {
      setTitle("");
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
