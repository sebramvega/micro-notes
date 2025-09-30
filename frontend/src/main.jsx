/*
Micro Notes — Frontend Entry Point
----------------------------------

Bootstraps the React app:
- Imports global styles
- Creates the React root and mounts <App/> into the #root element

Key behaviors & notes
- Uses React 18 `createRoot` API (replaces legacy ReactDOM.render).
- Keeps entry lean: no extra providers here (add Router/Context providers if needed).
- Global CSS is imported once at the entry to cascade across the app.

Typical usage
-------------
Bundled via Vite. In dev: `npm run dev` serves index.html → loads this file → renders <App/>.
*/

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/styles.css";

createRoot(document.getElementById("root")).render(<App />);
