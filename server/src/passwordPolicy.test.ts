import test from 'node:test'
import assert from 'node:assert/strict'
import { passwordSchema, PASSWORD_MIN_LENGTH } from './helpers.js'

/**
 * The password policy is the one rule that stands between a weak credential
 * and every account in the system, so it is pinned here rather than only
 * exercised through HTTP.
 *
 * The client's PasswordInput meter scores the same four rules (length,
 * lower, upper, digit) and its hint promises upper + digit, so the server
 * refusing anything the meter scores ≥ 3 would be an UI/server contract bug.
 */

test('a compliant password passes', () => {
  assert.doesNotThrow(() => passwordSchema.parse('Demo1234!'))
  assert.doesNotThrow(() => passwordSchema.parse('abcdef1A'))
})

test('each unmet rule is refused with a specific message', () => {
  assert.throws(() => passwordSchema.parse('aA1'), /au moins 6 caractères/)
  assert.throws(() => passwordSchema.parse('abcdef1'), /majuscule/)
  assert.throws(() => passwordSchema.parse('Abcdef'), /chiffre/)
})

test('lower case alone never satisfies the character requirements', () => {
  assert.throws(() => passwordSchema.parse('abcdefgh'))
})

test('digits alone never satisfy the character requirements', () => {
  assert.throws(() => passwordSchema.parse('12345678'))
})

test('symbols are optional and never rejected', () => {
  assert.doesNotThrow(() => passwordSchema.parse('Abcdef1!@#'))
})

test('the minimum length constant matches the schema', () => {
  // One char short of the minimum fails on length even with upper + digit.
  assert.throws(
    () => passwordSchema.parse(`aA1${'a'.repeat(PASSWORD_MIN_LENGTH - 4)}`),
    /au moins 6 caractères/,
  )
  // Exactly the minimum, with upper + digit, passes.
  assert.doesNotThrow(() => passwordSchema.parse(`aA1${'a'.repeat(PASSWORD_MIN_LENGTH - 3)}`))
})
