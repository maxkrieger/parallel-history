#!/usr/bin/env node
const { build, file, watch, cliopts } = require("estrella");
const process = require("process");
const path = require("path");
const webExt = require("web-ext");
const copyFiles = () => {
  file.copy("./src/popup/popup.html", "./dist/popup.html");
  file.copy("./src/newtab/newtab.html", "./dist/newtab.html");
  file.copy("./manifest.json", "./dist/manifest.json");
};
(async () => {
  file.mkdirs("./dist");
  copyFiles();
  const webExtRunner =
    cliopts.watch &&
    (await webExt.cmd.run({
      sourceDir: path.resolve(__dirname, "dist"),
      noInput: true,
      target: ["firefox-desktop"],
      // Set with a firefox profile name for persistence across dev runs
      // firefoxProfile: "ext-dev",
      keepProfileChanges: true,
      shouldExitProgram: false,
      browserConsole: true,
    }));
  process.on("SIGINT", () => {
    console.log("quitting...");
    webExtRunner.exit();
  });
  build({
    bundle: true,
    sourcemap: true,
    watch: cliopts.watch,
    keepNames: true,
    tsconfig: "./tsconfig.json",
    platform: "browser",
    entryPoints: [
      "src/background_script.ts",
      "src/popup/popup.ts",
      "src/newtab/index.ts",
    ],
    outdir: "dist",
    outbase: "src",
    onEnd: () => {
      webExtRunner && webExtRunner.reloadAllExtensions();
    },
    define: {
      "process.env.NODE_ENV": cliopts.watch ? '"development"' : '"production"',
    },
  });
})();

cliopts.watch && watch("src", copyFiles);
