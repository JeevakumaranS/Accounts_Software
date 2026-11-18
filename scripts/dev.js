const { spawn } = require("node:child_process");
const path = require("node:path");

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [
  {
    name: "Frontend",
    cwd: path.join(__dirname, "..", "frontend"),
    args: ["run", "dev"],
  },
  {
    name: "Backend",
    cwd: path.join(__dirname, "..", "backend"),
    args: ["run", "start:dev"],
  },
];

const children = [];
let stopping = false;

function forwardOutput(stream, label, destination) {
  let pending = "";
  stream.setEncoding("utf8");

  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r\n|\r|\n/);
    pending = lines.pop();

    for (const line of lines) {
      const cleanLine = line.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
      const colorCode = label === "Frontend" ? 36 : 35;
      const prefix =
        destination.isTTY && !process.env.NO_COLOR
          ? `\x1B[${colorCode}m[${label}]\x1B[0m`
          : `[${label}]`;
      destination.write(`${prefix} ${cleanLine}\n`);
    }
  });

  stream.on("end", () => {
    const trailing = pending.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
    if (trailing) {
      const colorCode = label === "Frontend" ? 36 : 35;
      const prefix =
        destination.isTTY && !process.env.NO_COLOR
          ? `\x1B[${colorCode}m[${label}]\x1B[0m`
          : `[${label}]`;
      destination.write(`${prefix} ${trailing}\n`);
    }
  });
}

function stopServices(signal) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill(signal);
    }
  }
}

for (const service of services) {
  const child = spawn(npmCommand, service.args, {
    cwd: service.cwd,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  children.push(child);
  forwardOutput(child.stdout, service.name, process.stdout);
  forwardOutput(child.stderr, service.name, process.stderr);

  child.on("error", (error) => {
    console.error(`Unable to start ${service.name}: ${error.message}`);
    process.exitCode = 1;
    stopServices("SIGTERM");
  });

  child.on("exit", (code, signal) => {
    if (stopping) return;

    if (code !== 0) {
      console.error(
        `${service.name} exited${signal ? ` after ${signal}` : ` with code ${code}`}.`,
      );
      process.exitCode = code || 1;
    } else {
      console.log(`${service.name} exited. Stopping both services.`);
    }

    stopServices("SIGTERM");
  });
}

process.on("SIGINT", () => {
  process.exitCode = 130;
  stopServices("SIGINT");
});

process.on("SIGTERM", () => {
  process.exitCode = 143;
  stopServices("SIGTERM");
});
