import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

function App() {
  return (
    <div style={{ padding: 30 }}>
      <h1>👓 Klear Vision OS</h1>
      <h2>React is Working! 🎉</h2>
    </div>
  );
}

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);