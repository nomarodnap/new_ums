const { spawn } = require("child_process");

const proc = spawn("pnpm.cmd", ["run", "db:generate"], {
  cwd: process.cwd(),
  shell: true,
});

proc.stdout.on("data", (data) => {
  const text = data.toString();
  console.log("STDOUT:", text);
  if (text.includes("?")) {
    proc.stdin.write("\n"); // Hit enter on prompts
  }
});

proc.stderr.on("data", (data) => {
  console.error("STDERR:", data.toString());
});

proc.on("close", (code) => {
  console.log(`Child process exited with code ${code}`);
});
