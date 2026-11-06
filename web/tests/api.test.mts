import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api } from '../lib/api.ts';
import { formatMoney, formatPercent } from '../lib/format.ts';

function mock(status: number, body: string, contentType?: string) {
  globalThis.fetch = (async () =>
    new Response(body || null, { status, headers: contentType ? { 'content-type': contentType } : {} })) as typeof fetch;
}

test('text/plain 201 (bare id) resolves, does not throw', async () => {
  mock(201, '0f39-uuid', 'text/plain; charset=utf-8');
  assert.equal(await api.neighbourhoods.create({ name: 'a', region: 'Junik' }), '0f39-uuid');
});

test('payments "[id id]" text body resolves', async () => {
  mock(201, '[a b]', 'text/plain');
  assert.equal(await api.payments.create({ family_id: 'x', amount: 3, year: 2024 }), '[a b]');
});

test('empty 200 resolves', async () => {
  mock(200, '');
  assert.equal(await api.families.remove('id'), '');
});

test('JSON list is parsed', async () => {
  mock(200, '[{"id":"1","name":"n"}]', 'application/json');
  const rows = await api.neighbourhoods.list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, '1');
});

test('error statuses map to Albanian messages (server text stays out of the message)', async () => {
  console.error = () => {};
  mock(400, 'bad year', 'text/plain');
  await assert.rejects(api.payments.list(), { message: 'Të dhënat nuk janë të sakta.', status: 400 });
  mock(404, 'x');
  await assert.rejects(api.families.get('1'), { message: 'Nuk u gjet.' });
  mock(503, 'boom');
  await assert.rejects(api.families.list(), { message: 'Ndodhi një gabim në server. Provoni përsëri.' });
  globalThis.fetch = (async () => { throw new TypeError('fetch failed'); }) as typeof fetch;
  await assert.rejects(api.families.list(), { message: 'Nuk ka lidhje me serverin. Provoni përsëri.', status: 0 });
});

test('new endpoints: stats, collection, history, bulk, recent', async () => {
  mock(200, '{"year":2026,"fee_per_member":3,"neighbourhoods":[]}', 'application/json');
  assert.equal((await api.stats(2026)).fee_per_member, 3);
  mock(200, 'null', 'application/json');
  assert.deepEqual(await api.collection(2026), []);
  assert.deepEqual(await api.recentPayments(), []);
  mock(201, '{"ids":["a","b"]}', 'application/json');
  const r = await api.payBulk({ family_ids: ['x'], year: 2026 });
  assert.deepEqual(r.ids, ['a', 'b']);
  assert.deepEqual(r.skipped, []);
  mock(201, '{"ids":null,"skipped":[{"family_id":"x","year":2026}]}', 'application/json');
  const r2 = await api.payBulk({ family_ids: ['x'], year: 2026 });
  assert.deepEqual(r2.ids, []);
  assert.deepEqual(r2.skipped, [{ family_id: 'x', year: 2026 }]);
});

test('null body on list calls becomes []', async () => {
  mock(200, 'null', 'application/json');
  assert.deepEqual(await api.neighbourhoods.list(), []);
  assert.deepEqual(await api.families.list(), []);
  assert.deepEqual(await api.families.details(), []);
  assert.deepEqual(await api.payments.list(), []);
  assert.deepEqual(await api.payments.details({ year: 2024 }), []);
  assert.deepEqual(await api.payments.noPaymentDetails({ year: 2024 }), []);
  assert.deepEqual(await api.regions(), []);
});

test('format helpers', () => {
  assert.match(formatMoney(12), /12/);
  assert.match(formatMoney(12), /€/);
  assert.match(formatPercent(0.5), /50/);
  assert.match(formatPercent(0 / 0), /0/);
});
