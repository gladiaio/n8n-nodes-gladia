import fs from 'node:fs';
import path from 'node:path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (!('overrides' in pkg)) {
	console.log('No overrides field to strip.');
	process.exit(0);
}

delete pkg.overrides;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, '\t')}\n`);
console.log('Stripped overrides from package.json.');
