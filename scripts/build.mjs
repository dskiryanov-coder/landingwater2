import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
const html = await readFile('dist/index.html', 'utf8');
const sources = [...html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g)].map(m => m[1]);
for (const file of new Set(sources)) await access(path.resolve('dist', file));
for (const slug of ['uv', 'clarification', 'sorption', 'iron', 'softening', 'complex']) await access('dist/assets/' + slug + '.svg');
console.log('Static site verified: ' + new Set(sources).size + ' referenced local files, 6 system diagrams.');
