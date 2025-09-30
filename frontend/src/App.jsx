/*
Micro Notes — App (Root Component)
----------------------------------

Root React component. Currently acts as a thin wrapper that renders
<NotesPage/>, the main screen of the app.

Key behaviors & notes
- Keeps root intentionally minimal; good place to add context providers,
  routers, or global error boundaries in the future.
- Separating <App/> from <main.jsx> allows tests to import and render
  the app without needing DOM bootstrap code.

Typical usage
-------------
    import App from "./App";
    <App />
*/

import React from "react";
import NotesPage from "./pages/NotesPage";

export default function App() {
  return <NotesPage />;
}
