import React from "react";
import Demo from "./components/Demo";
import Widgets from "./components/Widgets";

function App() {
  const [tab, setTab] = React.useState<"demo" | "widgets">("demo");
  return (
    <div className="">
      <div className="tab-container">
        <div className={`tab-button ${tab === "demo" ? "tab-button-active" : ""}`} onClick={() => setTab("demo")}>Demo</div>
        <div className={`tab-button ${tab === "widgets" ? "tab-button-active" : ""}`} onClick={() => setTab("widgets")}>Widgets</div>
      </div>
      {tab === "demo" ? <Demo /> : <Widgets />}
    </div>
  );
}

export default App;
