import { browser } from "webextension-polyfill-ts";
import Dexie from "dexie";
import { Entry, message } from "./types";
import { partition, reverse, sortBy, uniqBy } from "lodash";
import normalizeUrl from "normalize-url";
let db: Dexie;

const initDB = () => {
  db = new Dexie("ParallelHistory");
  db.version(2).stores({
    history:
      "++id,url,title,visitId,referringVisitId,referrerUrl,transition,time",
  });
};

// Enrich entry with up to date title
browser.history.onTitleChanged &&
  browser.history.onTitleChanged.addListener(async ({ url, title }) => {
    db.transaction("rw", db.table("history"), async () => {
      await db.table("history").where({ url }).modify({ title });
    });
  });

browser.history.onVisited.addListener(async (item) => {
  const visits = await browser.history.getVisits({ url: item.url! });
  const visit = visits[0];
  db.transaction("rw", db.table("history"), async () => {
    const predecessor = (await db
      .table("history")
      .where({ visitId: visit.referringVisitId })
      .first()) || { url: "" };
    const entry = {
      url: item.url!,
      title: item.title ?? "",
      visitId: visit.visitId,
      time: visit.visitTime!,
      referringVisitId: visit.referringVisitId,
      referrerUrl: predecessor.url,
      transition: visit.transition,
      canonicalizedUrl: normalizeUrl(item.url!, {
        stripHash: true,
        stripTextFragment: true,
        stripWWW: true,
      }),
    };
    await db.table("history").add(entry);
  });
});

browser.runtime.onMessage.addListener(async (message: message) => {
  switch (message.kind) {
    case "GET_HISTORY":
      return db.table("history").orderBy("time").reverse().toArray();
    case "CLEAR_DB":
      await db.delete();
      initDB();
      break;
    case "RANK":
      const mappedScored = await Promise.all(
        message.scoredItems.map(async ({ url, score, sign }) => {
          const successors: Entry[] = await db
            .table("history")
            .where({ referrerUrl: message.scoredItems[0].url })
            .toArray();
          const predecessors: Entry[] = (
            await db
              .table("history")
              .where({ url })
              .toArray(async (entries) => {
                return await Promise.all(
                  entries.map(async (entry: any) => {
                    return await db
                      .table("history")
                      .where({ url: entry.referrerUrl })
                      .toArray();
                  })
                );
              })
          ).flat();
          const related = uniqBy([...successors, ...predecessors], "url");
          return { url, score, sign, related };
        })
      );
      const urlScores: { [url: string]: Entry } = {};
      mappedScored.forEach((scored) => {
        scored.related.forEach((related: Entry) => {
          if (related.url in urlScores) {
            if (related.title !== "" && urlScores[related.url].title === "") {
              urlScores[related.url].title = related.title;
            }
            urlScores[related.url].score! += scored.score;
          } else {
            urlScores[related.url] = {
              ...related,
              score: scored.score,
              sign: scored.sign,
            };
          }
        });
      });
      const [negs, pos] = partition(
        Object.entries(urlScores).map(([url, info]) => ({ ...info, url })),
        ({ sign }) => sign === -1
      );
      return [sortBy(negs, "score"), reverse(sortBy(pos, "score"))];
  }
});

initDB();
