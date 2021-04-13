import React, { useCallback } from "react";
import { browser } from "webextension-polyfill-ts";
const Main = () => {
  const onClearDB = useCallback(() => {
    (async () => {
      browser.runtime.sendMessage({ kind: "CLEAR_DB" });
    })();
  }, []);
  return (
    <div>
      <h1>Parallel History</h1>
      <div>
        <button onClick={onClearDB}>clear database</button>
      </div>
    </div>
  );
};

export default <Main />;
