import fs from 'node:fs';
import path from 'node:path';

const packageJsonPaths = ['package.json', 'dist/package.json'].map((file) =>
	path.resolve(process.cwd(), file),
);

let stripped = 0;

for (const packageJsonPath of packageJsonPaths) {
	if (!fs.existsSync(packageJsonPath)) {
		continue;
	}

	const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

	if (!('overrides' in pkg)) {
		continue;
	}

	delete pkg.overrides;
	fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, '\t')}\n`);
	console.log(`Stripped overrides from ${path.relative(process.cwd(), packageJsonPath)}.`);
	stripped++;
}

if (stripped === 0) {
	console.log('No overrides field to strip.');
}
