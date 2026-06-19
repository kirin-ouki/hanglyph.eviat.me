import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import { setHanaMinEnabled } from "./lib/fonts";

// 還原使用者的 HanaMin 偏好（在 React 掛載前套用，避免閃爍）
setHanaMinEnabled(localStorage.getItem("chct.hanamin") === "1");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
