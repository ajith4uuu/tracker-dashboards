const { spawn } = require('child_process');

function start(name, command, args = [], options = {}) {
  const proc = spawn(command, args, {
    shell: true,
    stdio: 'inherit',
    ...options,
  });
  proc.on('exit', (code, signal) => {
    console.log(`[${name}] exited with code ${code} signal ${signal}`);
  });
  proc.on('error', (err) => {
    console.error(`[${name}] error:`, err);
  });
  return proc;
}

const children = [];

// Start backend on 8081
children.push(
  start(
    'backend',
    'npm',
    ['run', 'dev'],
    { cwd: 'backend', env: { ...process.env, PORT: '8081' } }
  )
);

// Start frontend on 8080
children.push(
  start(
    'frontend',
    'npm',
    ['start'],
    { cwd: 'frontend', env: { ...process.env, PORT: '8080' } }
  )
);

function shutdown() {
  console.log('Shutting down child processes...');
  for (const child of children) {
    if (child && !child.killed) {
      try {
        child.kill('SIGINT');
      } catch {}
    }
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep process alive
setInterval(() => {}, 1 << 30);
