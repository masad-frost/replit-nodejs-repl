#!/usr/bin/nodejs

const repl = require('repl');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const rl = require('readline-sync');
const tty = require('tty');
const Module = require('module');

let r;

// Red errors.
function logError(msg) {
  process.stdout.write('\u001b[31m' + msg + '\u001b[0m');
}

// The nodejs repl operates in raw mode and does some funky stuff to
// the terminal. This ns the repl and forces non-raw mode.
function pauseRepl() {
  if (!r) return;

  r.pause();
  process.stdin.setRawMode(false);
}

// Forces raw mode and resumes the repl.
function resumeRepl() {
  if (!r) return;

  process.stdin.setRawMode(true);
  r.resume();
}

// Clear the line if it has anything on it.
function clearLine() {
  if (r && r.line) r.clearLine();
}

// Adapted from the internal node repl code just a lot simpler and adds
// red errors (see https://bit.ly/2FRM86S)
function handleError(e) {
  if (r) {
    r.lastError = e;
  }

  if (e && typeof e === 'object' && e.stack && e.name) {
    if (e.name === 'SyntaxError') {
      e.stack = e.stack
        .replace(/^repl:\d+\r?\n/, '')
        .replace(/^\s+at\s.*\n?/gm, '');
    }

    logError(e.stack);
  } else {
    // For some reason needs a newline to flush.
    logError('Thrown: ' + r.writer(e) + '\n');
  }

  if (r) {
    r.clearBufferedCommand();
    r.lines.level = [];
    r.displayPrompt();
  }
}

function start() {
  r = repl.start({
    prompt: '\u001b[33m\uEEA7\u001b[00m ',
    useGlobal: true,
  });
  // remove the internal error and ours for red etc.
  r._domain.removeListener('error', r._domain.listeners('error')[0]);
  r._domain.on('error', handleError);
  process.on('uncaughtException', handleError);
}

global.alert = console.log;
global.prompt = p => {
  pauseRepl();
  clearLine();

  let ret = rl.question(`${p}> `, {
    hideEchoBack: false,
  });

  resumeRepl();

  // Display prompt on the next turn.
  if (r) setImmediate(() => r.displayPrompt());

  return ret;
};

global.confirm = q => {
  pauseRepl();
  clearLine();

  const ret = rl.keyInYNStrict(q);

  resumeRepl();

  // Display prompt on the next turn.
  if (r) setImmediate(() => r.displayPrompt());
  return ret;
};

if (process.argv[2]) {
  const mainPath = path.resolve(process.argv[2]);
  const main = fs.readFileSync(mainPath, 'utf-8');

  // global.__filename = mainPath;
  // global.__dirname = path.dirname(mainPath);

	// const mod = new require('module')
  // mod.parent = null;
  // mod.filename = mainPath;
  // mod.paths = module.paths;
	// global.require = (path) => mod.require(path); 
  // global.module = mod;

  const childModule = new module.__proto__.constructor(mainPath);
  childModule.parent = null;
  childModule.filename = mainPath;
  childModule.paths = module.paths;
  global.module = childModule;
  global.require = require


  let script;
  try {
    script = vm.createScript(main, {
      filename: mainPath,
      displayErrors: false,
    });
  } catch (e) {
    handleError(e);
  }

  if (script) {
    process.on('SIGINT', start);
    
    let res;
    try {
      res = script.runInThisContext({
        displayErrors: false,
      });
    } catch (e) {
      handleError(e);
    }

    if (typeof res !== 'undefined') {
      console.log(res);
    }
  }
  process.on('beforeExit', start);
} else {
  start();
}