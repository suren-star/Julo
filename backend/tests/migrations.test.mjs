import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runMigrations } from '../src/db/migrations.js';

test('migrations are applied transactionally and tracked by checksum', async () => {
  const dir=await mkdtemp(path.join(tmpdir(),'julo-migrations-'));
  await writeFile(path.join(dir,'001_first.sql'),'CREATE TABLE example(id int);\n');
  const calls=[];
  const client={
    async query(sql,params){
      calls.push({sql,params});
      if (sql.startsWith('SELECT name, sha256')) return {rows:[]};
      return {rows:[]};
    },
    release(){calls.push({sql:'RELEASE'});},
  };
  const pool={query:client.query.bind(client),async connect(){return client;}};
  const applied=await runMigrations(pool,dir);
  assert.deepEqual(applied,['001_first.sql']);
  assert.ok(calls.some((c)=>c.sql==='BEGIN'));
  assert.ok(calls.some((c)=>c.sql==='COMMIT'));
  const insert=calls.find((c)=>String(c.sql).startsWith('INSERT INTO schema_migrations'));
  assert.equal(insert.params[0],'001_first.sql');
  assert.match(insert.params[1],/^[a-f0-9]{64}$/);
  assert.equal(calls.at(-1).sql,'RELEASE');
});
