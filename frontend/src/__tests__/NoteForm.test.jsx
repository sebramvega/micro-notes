import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import NoteForm from "../components/NoteForm";

test("submits and clears inputs", async () => {
  const onAdd = vi.fn().mockResolvedValue(true);
  render(<NoteForm onAdd={onAdd} />);

  const title = screen.getByPlaceholderText("Title");
  const body = screen.getByPlaceholderText("Body");
  const add = screen.getByRole("button", { name: /add/i });

  const user = userEvent.setup();
  await user.type(title, "Test Title");
  await user.type(body, "Test Body");
  await user.click(add);

  await waitFor(() => {
    expect(onAdd).toHaveBeenCalledWith("Test Title", "Test Body");
    expect(title).toHaveValue("");
    expect(body).toHaveValue("");
  });
});
