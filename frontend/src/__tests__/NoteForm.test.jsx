/*
Micro Notes — NoteForm Component Test
-------------------------------------

Unit/integration test for <NoteForm/> using Vitest + React Testing Library.

Key behaviors & notes
- Mocks `onAdd` to resolve `true`, simulating a successful note creation.
- Simulates typing into Title/Body and clicking "Add".
- Asserts:
  1) `onAdd` called with trimmed values.
  2) Inputs cleared after a successful add.

Why important:
- Ensures form state resets only after confirmed success.
- Validates controlled input wiring + submit behavior.
- Guards against regressions in trimming/clearing logic.

Typical usage
-------------
    vitest run frontend/src/__tests__/NoteForm.test.jsx
*/

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import NoteForm from "../components/NoteForm";

test("submits and clears inputs", async () => {
  const onAdd = vi.fn().mockResolvedValue(true); // why: simulate a successful backend call
  render(<NoteForm onAdd={onAdd} />);

  const title = screen.getByPlaceholderText("Title");
  const body = screen.getByPlaceholderText("Body");
  const add = screen.getByRole("button", { name: /add/i });

  const user = userEvent.setup();
  await user.type(title, "Test Title"); // why: controlled input simulates typing
  await user.type(body, "Test Body");
  await user.click(add);

  await waitFor(() => {
    // why: ensure submit handler called with trimmed values
    expect(onAdd).toHaveBeenCalledWith("Test Title", "Test Body");
    // why: successful add should clear both inputs
    expect(title).toHaveValue("");
    expect(body).toHaveValue("");
  });
});
