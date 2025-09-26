import React from "react";

export default function NoteList({ items, onUpdate, onDelete }) {
  if (!items || items.length === 0) {
    return <div className="muted">No notes yet.</div>;
  }

  return (
    <div>
      {items.map((n) => (
        <div className="note" key={n.id}>
          <h4
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              onUpdate(n.id, { title: e.currentTarget.textContent })
            }
          >
            {n.title}
          </h4>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              onUpdate(n.id, { body: e.currentTarget.textContent })
            }
          >
            {n.body}
          </div>
          <div className="space" />
          <button className="btn" onClick={() => onDelete(n.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
