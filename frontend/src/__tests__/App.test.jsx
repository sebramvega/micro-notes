import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "../App";

test("renders login form", () => {
  render(<App />);
  expect(screen.getByText(/Log in or sign up/i)).toBeInTheDocument();
});
