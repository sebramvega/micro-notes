/*
Micro Notes — Note List (Inline Edit + Delete)
----------------------------------------------

Renders a list of notes with **inline editing** via `contentEditable` fields
and a Delete action per note. Update events are propagated upward via `onUpdate`
and removals via `onDelete`.

Key behaviors & notes
- Empty state: shows a muted "No notes yet." message.
- Inline edit strategy:
  - Uses `contentEditable` on the title/body nodes for a low-friction UX.
  - Commits edits on `onBlur` (i.e., when focus leaves the element).
  - Sends a minimal patch `{ title }` or `{ body }` to `onUpdate(id, patch)`.
- `suppressContentEditableWarning` is set to avoid React’s controlled/uncontrolled warning.
- Parent component owns list state; this component is purely presentational.
- Keys: uses `n.id` for consistent reconciliation.

Typical usage
-------------
    <NoteList items={notes} onUpdate={updateNote} onDelete={deleteNote} />
*/

import React from "react";

export default function NoteList({ items, onUpdate, onDelete }) {
  if (!items || items.length === 0) {
    // why: simple, accessible empty state when there are no notes
    return <div className="muted">No notes yet.</div>;
  }

  return (
    <div>
      {items.map((n) => (
        <div className="note" key={n.id}>
          <h4
            contentEditable
            suppressContentEditableWarning
            // why: commit title edit when user leaves the field; avoid update per keystroke
            onBlur={(e) =>
              onUpdate(n.id, { title: e.currentTarget.textContent })
            }
          >
            {n.title}
          </h4>
          <div
            contentEditable
            suppressContentEditableWarning
            // why: commit body edit on blur; keeps UI snappy and network-chatter minimal
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
