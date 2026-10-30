'use strict';

const path = require('node:path');
const fs = require('node:fs');

// Robust multi-path resolution for package.json across all CI runner environments
const candidatePaths = [
  path.join(process.cwd(), 'package.json'),
  path.join(__dirname, '..', 'package.json'),
  path.resolve('package.json')
];

let pkgPath = null;
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    pkgPath = p;
    break;
  }
}

if (!pkgPath) {
  console.error('Violation: package.json not found in any candidate path.');
  process.exit(1);
}

const pkg = require(pkgPath);
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  console.error('Violation: External runtime dependencies detected!');
  process.exit(1);
}

console.log('OK: Zero-dependency invariant verified.');
