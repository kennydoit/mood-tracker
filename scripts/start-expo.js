#!/usr/bin/env node

const { spawn } = require("node:child_process");

const userArgs = process.argv.slice(2);
const hasTransport = userArgs.some((arg) =>
  ["--tunnel", "--lan", "--localhost"].includes(arg)
);

// Use tunnel by default on Windows and LAN on Unix-like systems.
if (!hasTransport) {
  userArgs.unshift(process.platform === "win32" ? "--tunnel" : "--lan");
}

if (!userArgs.includes("--clear")) {
  userArgs.push("--clear");
}

const expoCliPath = require.resolve("expo/bin/cli", { paths: [process.cwd()] });
const expoArgs = ["start", "--port", "8081", ...userArgs];

const child = spawn(process.execPath, [expoCliPath, ...expoArgs], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
