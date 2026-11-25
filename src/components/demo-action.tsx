"use client";

import { useState } from "react";

export function DemoAction() {
  const [done, setDone] = useState(false);
  return (
    <>
      <button
        className="button-primary"
        type="button"
        onClick={() => setDone(true)}
        disabled={done}
      >
        {done ? "Ação preparada (demo)" : "Registar próxima ação"}
      </button>
      <span className="muted">
        {done
          ? "Não foi enviada a nenhum sistema."
          : "Ação local demonstrativa"}
      </span>
    </>
  );
}
