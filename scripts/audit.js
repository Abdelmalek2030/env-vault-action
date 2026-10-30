'use strict';

const path = require('node:path');
const fs = require('node:fs');

const pkgPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error('Violation: package.json not found at root path.');
  process.exit(1);
}

const pkg = require(pkgPath);
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  console.error('Violation: External runtime dependencies detected!');
  process.exit(1);
}

console.log('OK: Zero-dependency invariant verified.');
