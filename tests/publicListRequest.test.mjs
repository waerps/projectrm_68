import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicListRequest } from '../src/utils/publicListRequest.js';

test('public lists retry a transient failure before showing an error', async () => {
  let attempts = 0;
  const rows = await publicListRequest(async () => {
    if (++attempts === 1) throw new Error('temporary gateway failure');
    return [{ id: 1 }];
  });
  assert.equal(attempts, 2);
  assert.deepEqual(rows, [{ id: 1 }]);
});

test('an unexpectedly empty public list gets one fresh read', async () => {
  let attempts = 0;
  const rows = await publicListRequest(async () => (++attempts === 1 ? [] : [{ id: 2 }]));
  assert.equal(attempts, 2);
  assert.deepEqual(rows, [{ id: 2 }]);
});

test('persistent failures remain errors rather than becoming empty lists', async () => {
  await assert.rejects(publicListRequest(async () => { throw new Error('offline'); }), /offline/);
});
