import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PLATFORM_FEE_RATE,
  DELIVERY_FEE,
  FREE_DELIVERY_ABOVE,
  platformFeeFor,
  deliveryFeeFor,
  basePriceFor,
  locationFor,
} from './catalog.js'
import { boundedInt } from './db.js'

/**
 * These functions decide what a patient is charged and where a consultation
 * happens. They are pure, so they are the cheapest place to pin behaviour —
 * and `node --test` needs no new dependency.
 */

test('platform fee is 5% of the base price, rounded', () => {
  assert.equal(PLATFORM_FEE_RATE, 0.05)
  assert.equal(platformFeeFor(35_000), 1_750)
  assert.equal(platformFeeFor(40_000), 2_000)
  assert.equal(platformFeeFor(50_000), 2_500)
  // Rounding is half-up on the decimal, matching the client-side preview.
  assert.equal(platformFeeFor(1), 0)
  assert.equal(platformFeeFor(3), 0)
  assert.equal(platformFeeFor(7), 0) // 0.35 -> 0
  assert.equal(platformFeeFor(0), 0)
})

test('base + fee equals the total the booking endpoint stores', () => {
  for (const base of [22_000, 25_000, 28_000, 30_000, 35_000, 40_000, 50_000, 65_000, 70_000]) {
    const total = base + platformFeeFor(base)
    // The client mirrors this arithmetic, so the two must agree exactly or the
    // amount shown at checkout differs from the amount charged.
    assert.equal(total, base + Math.round(base * 0.05))
    assert.ok(total > base, 'fee must be non-negative')
  }
})

test('delivery fee is waived at or above the free-delivery threshold', () => {
  assert.equal(DELIVERY_FEE, 3_500)
  assert.equal(FREE_DELIVERY_ABOVE, 20_000)
  assert.equal(deliveryFeeFor(0), 3_500)
  assert.equal(deliveryFeeFor(19_999), 3_500)
  assert.equal(deliveryFeeFor(20_000), 0, 'threshold is inclusive')
  assert.equal(deliveryFeeFor(20_001), 0)
  assert.equal(deliveryFeeFor(100_000), 0)
})

test('delivery total is subtotal plus fee', () => {
  const cases: [number, number, number][] = [
    // subtotal, expected fee, expected total
    [3_500, 3_500, 7_000],
    [8_000, 3_500, 11_500],
    [19_999, 3_500, 23_499],
    [20_000, 0, 20_000],
    [40_000, 0, 40_000],
  ]
  for (const [subtotal, fee, total] of cases) {
    assert.equal(deliveryFeeFor(subtotal), fee)
    assert.equal(subtotal + deliveryFeeFor(subtotal), total)
  }
})

test('home visits use the home price, and fall back to the base price', () => {
  const record = { price: 30_000, price_home: 50_000 }
  assert.equal(basePriceFor(record, 'cabinet'), 30_000)
  assert.equal(basePriceFor(record, 'hospital'), 30_000)
  assert.equal(basePriceFor(record, 'home'), 50_000)
  assert.equal(basePriceFor(record, null), 30_000)
  // A provider who never set a home fee must not book home visits for free.
  assert.equal(basePriceFor({ price: 30_000, price_home: null }, 'home'), 30_000)
  // Roles with no price column cannot be booked: the endpoint rejects <= 0.
  assert.equal(basePriceFor({}, 'cabinet'), 0)
  assert.equal(basePriceFor({}, 'home'), 0)
  assert.equal(basePriceFor(null, 'cabinet'), 0)
})

test('consultation location follows the consultation mode', () => {
  const record = { location: 'Analakely, Antananarivo 101', city: 'Antananarivo' }
  assert.equal(locationFor(record, 'cabinet', 'Antananarivo'), 'Analakely, Antananarivo 101')
  assert.equal(
    locationFor(record, 'home', 'Toamasina'),
    'Toamasina — À domicile',
    'home visits happen at the patient address',
  )
  assert.match(locationFor(record, 'hospital', 'Antananarivo'), /Hôpital partenaire$/)
  // Must not produce a doubled comma when the location has no city part.
  assert.doesNotMatch(locationFor({ location: 'Analakely', city: '' }, 'hospital', 'Tana'), /,\s*,/)
  assert.doesNotMatch(locationFor({ location: 'Analakely', city: '' }, 'hospital', 'Tana'), /,\s*$/)
})

test('boundedInt clamps into range and falls back on nonsense', () => {
  assert.equal(boundedInt(5, 1, 10, 1), 5)
  assert.equal(boundedInt(0, 1, 10, 1), 1, 'below min')
  assert.equal(boundedInt(999, 1, 10, 1), 10, 'above max')
  assert.equal(boundedInt('7', 1, 10, 1), 7, 'numeric string')
  assert.equal(boundedInt(7.9, 1, 10, 1), 7, 'truncates, never rounds up')
  assert.equal(boundedInt(undefined, 1, 10, 3), 3)
  assert.equal(boundedInt('abc', 1, 10, 3), 3)
  assert.equal(boundedInt(NaN, 1, 10, 3), 3)
  // Non-finite input uses the default rather than clamping: `?limit=Infinity`
  // should get the ordinary page size, not the maximum.
  assert.equal(boundedInt(Infinity, 1, 10, 3), 3)
  assert.equal(boundedInt(-Infinity, 1, 10, 3), 3)
  // Guards the SQL-interpolation path: the result must always be an integer.
  for (const input of ['1; DROP TABLE users', '-1', '0', '1e3', {}]) {
    const out = boundedInt(input, 1, 200, 50)
    assert.ok(Number.isInteger(out), `${String(input)} -> ${out}`)
    assert.ok(out >= 1 && out <= 200)
  }
})
