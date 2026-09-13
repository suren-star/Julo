import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const TEST_PASSWORD = '12345';
const TEST_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';

export const TEST_USERS = Object.freeze([
  { id:'00000000-0000-4000-8000-000000000101', username:'owner1', email:'owner1@testing.julo.local', displayName:'Սեփականատեր', role:'owner' },
  { id:'00000000-0000-4000-8000-000000000102', username:'admin1', email:'admin1@testing.julo.local', displayName:'Ադմինիստրատոր', role:'admin' },
  { id:'00000000-0000-4000-8000-000000000103', username:'member1', email:'member1@testing.julo.local', displayName:'Անդամ', role:'member' },
  { id:'00000000-0000-4000-8000-000000000104', username:'viewer1', email:'viewer1@testing.julo.local', displayName:'Դիտորդ', role:'viewer' },
  { id:'00000000-0000-4000-8000-000000000105', username:'guest1', email:'guest1@testing.julo.local', displayName:'Հյուր', role:'guest' },
]);

async function hashWeakDevelopmentPassword(password) {
  const salt = randomBytes(16);
  const N=16384, r=8, p=1;
  const derived = await scrypt(password, salt, 64, { N, r, p, maxmem:64*1024*1024 });
  return ['scrypt',N,r,p,salt.toString('base64url'),Buffer.from(derived).toString('base64url')].join('$');
}

export async function seedRequestedTestUsers(repository, env=process.env) {
  if (env.NODE_ENV === 'production') throw new Error('Development test users cannot be seeded in production.');
  if (env.JULO_ALLOW_TEST_SEED !== '1') throw new Error('Set JULO_ALLOW_TEST_SEED=1 to seed development test users.');
  if (!repository?.seedDevelopmentUsers) throw new TypeError('Repository seedDevelopmentUsers adapter is required.');
  const users=[];
  for (const user of TEST_USERS) users.push({...user,passwordHash:await hashWeakDevelopmentPassword(TEST_PASSWORD)});
  return repository.seedDevelopmentUsers({workspaceId:TEST_WORKSPACE_ID,workspaceName:'Julo Test Workspace',users});
}

export const REQUESTED_TEST_CREDENTIALS = Object.freeze(TEST_USERS.map((user)=>({username:user.username,password:TEST_PASSWORD,role:user.role})));
