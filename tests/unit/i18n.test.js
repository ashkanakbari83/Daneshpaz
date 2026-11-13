import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_MESSAGES, translate } from '../../src/i18n/index.js';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

test('every message is a non-empty [fa, en] pair with matching placeholders', () => {
  for (const [key, val] of Object.entries(ALL_MESSAGES)) {
    assert.ok(Array.isArray(val) && val.length === 2, key);
    assert.ok(val[0].trim() && val[1].trim(), key);
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
    assert.equal(ph(val[0]), ph(val[1]), `placeholders differ in ${key}`);
  }
});

test('all t("…") keys used in src exist', () => {
  const dynamic = ['diff.1', 'diff.2', 'diff.3', 'cat.basic', 'cat.spice', 'cat.veg', 'cat.meat', 'cat.dairy', 'cat.grain', 'cat.legume',
    'unit.g', 'unit.kg', 'unit.ml', 'unit.l', 'unit.pcs', 'unit.clove', 'unit.tbsp', 'unit.tsp', 'filter.missing.0', 'filter.missing.2'];
  const used = new Set(dynamic);
  const re = /\bt\(\s*['"]([\w.]+)['"]/g;
  for (const file of walk('src').filter((f) => /\.(jsx?|mjs)$/.test(f))) {
    const code = readFileSync(file, 'utf8');
    let m;
    while ((m = re.exec(code))) used.add(m[1]);
  }
  const missing = [...used].filter((k) => !(k in ALL_MESSAGES));
  assert.deepEqual(missing, []);
});

test('translate fills params and falls back to the key', () => {
  assert.equal(translate('cook.step', { n: '۲', total: '۵' }), '۲ از ۵');
  assert.equal(translate('cook.step', { n: 2, total: 5 }, 'en'), '2 of 5');
  assert.equal(translate('nope.key'), 'nope.key');
});
