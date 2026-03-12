import { spawnSync } from "node:child_process";

const command = process.platform === "win32" ? "pwsh" : "sh";
const args =
  process.platform === "win32"
    ? ["scripts/build-all.ps1"]
    : ["scripts/build-all.sh"];
const result = spawnSync(command, args, {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
