import assert from 'node:assert/strict';
import test from 'node:test';
import { createPostgresRepository } from '../src/db/postgres-repository.js';

test('findAuthUserByEmail uses parameterized query', async () => {
  const calls=[];
  const pool={ async query(sql, params){ calls.push({sql,params}); return {rows:[{id:'u1',email_normalized:'a@example.com',display_name:'A',disabled_at:null,password_hash:'hash'}]}; } };
  const repo=createPostgresRepository(pool);
  const user=await repo.findAuthUserByEmail('a@example.com');
  assert.equal(user.id,'u1');
  assert.deepEqual(calls[0].params,['a@example.com']);
  assert.match(calls[0].sql,/\$1/);
});
