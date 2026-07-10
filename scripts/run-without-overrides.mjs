import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const original = fs.readFileSync(packageJsonPath, 'utf8');
const pkg = JSON.parse(original);

if ('overrides' in pkg) {
	delete pkg.overrides;
	fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, '\t')}\n`);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
	fs.writeFileSync(packageJsonPath, original);
	console.error('Usage: node scripts/run-without-overrides.mjs <command> [args...]');
	process.exit(1);
}

const child = spawn(command, args, {
	stdio: 'inherit',
	shell: process.platform === 'win32',
});

const restore = () => {
	fs.writeFileSync(packageJsonPath, original);
};

child.on('error', (error) => {
	restore();
	console.error(error);
	process.exit(1);
});

child.on('exit', (code, signal) => {
	restore();
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 1);
});
