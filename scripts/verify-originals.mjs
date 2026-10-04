// Confirms the three originals are byte-identical to the state recorded
// before the build started.
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { ORIGINALS } from './originals.mjs';

let ok = true;
for (const [name, { path, sha256 }] of Object.entries(ORIGINALS)) {
  const hash = createHash('sha256').update(await readFile(path)).digest('hex');
  const same = hash === sha256;
  ok &&= same;
  console.log(`${same ? 'unchanged' : 'CHANGED  '}  ${name}  ${path}`);
}
if (!ok) {
  console.error('One or more originals differ from the recorded hashes.');
  process.exit(1);
}
