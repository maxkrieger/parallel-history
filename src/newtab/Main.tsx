import { shuffle, uniqBy } from "lodash";
import React, {
  createRef,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useState,
} from "react";
import { browser } from "webextension-polyfill-ts";
import { Entry, ScoredLeftItem } from "../types";

const RightEntry = ({ entry }: { entry: Entry }) => {
  return (
    <a key={entry.url} href={entry.url}>
      <div
        key={entry.url}
        style={{
          padding: "10px",
          fontFamily: "sans-serif",
          fontSize: "12px",
          margin: "10px",
          backgroundColor: "#e8e8e8",
          cursor: "pointer",
          opacity: entry.score,
        }}
      >
        {entry.title}
        <span style={{ fontSize: "10px", color: "#7e7e7e" }}>
          {entry.url} {entry.referrerUrl}
        </span>
      </div>
    </a>
  );
};

const Main = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [leftRefs, setLeftRefs] = useState<RefObject<HTMLElement>[]>([]);
  const [aboveEntries, setAboveEntries] = useState<any[]>([]);
  const [belowEntries, setBelowEntries] = useState<any[]>([]);
  const recompute = useCallback(() => {
    const pageCenterY = window.innerHeight / 2;
    const scores = leftRefs.map((ref: any, idx: number) => {
      const cur = ref.current;
      if (ref.current) {
        const curY = cur.getBoundingClientRect().y;
        const percentFromCenter = (curY - pageCenterY) / pageCenterY;
        const score = Math.max(0, 1 - Math.abs(percentFromCenter));
        return [score, idx, Math.sign(percentFromCenter)];
      }
      return [0, idx, 1];
    });
    leftRefs.forEach((ref: any, i: number) => {
      const cur = ref.current;
      if (ref.current) {
        cur.style.opacity = scores[i][0].toString();
      }
    });
    const mappedScored: ScoredLeftItem[] = scores
      .filter(([score]) => score > 0)
      .map(([score, idx, sign]) => ({ url: entries[idx].url, score, sign }));
    (async () => {
      const [top, bot] = await browser.runtime.sendMessage({
        kind: "RANK",
        scoredItems: mappedScored,
      });
      setAboveEntries(top);
      setBelowEntries(bot);
    })();
  }, [leftRefs, entries]);
  useEffect(() => {
    (async () => {
      const arr = await browser.runtime.sendMessage({ kind: "GET_HISTORY" });
      const entries = uniqBy(
        arr.filter(({ title }: any) => title !== ""),
        "url"
      );
      await setLeftRefs(entries.map(() => createRef<HTMLElement>()));
      await setEntries(entries as any);
    })();
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>
      <div
        style={{
          maxHeight: "100%",
          width: "50%",
          overflow: "auto",
          borderRight: "1px solid black",
        }}
        onScroll={recompute}
        onClick={recompute}
      >
        <div style={{ marginBottom: window.innerHeight / 2 + "px" }} />
        {entries.map((entry, idx) => (
          <a href={entry.url} key={entry.id}>
            <div
              style={{
                padding: "1em",
                fontFamily: "sans-serif",
                margin: "1em",
                fontSize: "24px",
                backgroundColor: "#e8e8e8",
                cursor: "pointer",
              }}
              ref={leftRefs[idx] as any}
            >
              {entry.title}
            </div>
          </a>
        ))}
        <div style={{ marginTop: window.innerHeight / 2 + "px" }} />
      </div>
      <div
        style={{
          height: "100%",
          width: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div>
          {aboveEntries.map((entry) => (
            <RightEntry entry={entry} key={entry.url + "above"} />
          ))}
          {belowEntries.map((entry) => (
            <RightEntry entry={entry} key={entry.url + "below"} />
          ))}
        </div>
      </div>
    </div>
  );
};
export default <Main />;
