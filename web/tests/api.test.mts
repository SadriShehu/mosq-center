import assert from 'node:assert/strict';
import { test } from 'node:test';
import { api } from '../lib/api.ts';

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

test('error status throws ApiError with message', async () => {
  mock(400, 'bad year', 'text/plain');
  await assert.rejects(api.payments.list(), /bad year/);
});
