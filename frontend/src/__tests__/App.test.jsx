/*
Micro Notes — App Smoke Test
----------------------------

Very light smoke test to ensure the root <App/> renders the unauthenticated
state (login/signup prompt). Acts as a guard against regressions in routing
or initial rendering.

Key behaviors & notes
- Renders <App/> without any auth token present.
- Expects the copy "Log in or sign up" to be visible.
- Keeps scope intentionally narrow to stay fast and reliable.

Typical usage
-------------
    vitest run frontend/src/__tests__/App.test.jsx
*/

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

test("renders login form", () => {
  render(<App />); // why: initial render with no token should show auth form
  expect(screen.getByText(/Log in or sign up/i)).toBeInTheDocument();
});
