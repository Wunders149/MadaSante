import test from 'node:test'
import assert from 'node:assert/strict'
import {
  APPOINTMENT_STATUSES,
  PROVIDER_TRANSITIONS,
  PATIENT_TRANSITIONS,
  ADMIN_TRANSITIONS,
  transitionsFor,
  canTransition,
} from './appointmentStatus.js'
import { isProviderRole, isPractitionerRole, PROVIDER_ROLES, PRACTITIONER_ROLES, uniqueId } from './helpers.js'

/**
 * The status machine is what stands between "a patient marked their own visit
 * completed" and a correct booking history, so the rules are pinned here rather
 * than only exercised through HTTP.
 */

const ALL = [...APPOINTMENT_STATUSES]

test('a patient can only withdraw their own booking', () => {
  for (const from of ALL) {
    for (const to of ALL) {
      const expected = to === 'cancelled' && (from === 'pending' || from === 'confirmed')
      assert.equal(
        canTransition('patient', from, to),
        expected,
        `patient ${from} -> ${to} should be ${expected ? 'allowed' : 'refused'}`,
      )
    }
  }
})

test('a patient can never confirm or complete their own appointment', () => {
  for (const from of ALL) {
    assert.ok(!canTransition('patient', from, 'confirmed'))
    assert.ok(!canTransition('patient', from, 'completed'))
  }
})

test('a provider can confirm a pending request and complete a confirmed visit', () => {
  assert.ok(canTransition('doctor', 'pending', 'confirmed'))
  assert.ok(canTransition('kinesitherapist', 'confirmed', 'completed'))
  assert.ok(canTransition('doctor', 'pending', 'cancelled'))
})

test('an admin can do anything a provider can', () => {
  for (const from of ALL) {
    for (const to of ALL) {
      assert.equal(
        canTransition('admin', from, to),
        canTransition('doctor', from, to),
        `admin and provider disagree on ${from} -> ${to}`,
      )
    }
  }
})

test('completed and cancelled are terminal', () => {
  for (const table of [PROVIDER_TRANSITIONS, PATIENT_TRANSITIONS, ADMIN_TRANSITIONS]) {
    for (const terminal of ['completed', 'cancelled']) {
      assert.deepEqual(table[terminal] ?? [], [], `${terminal} must be terminal`)
      for (const to of ALL) {
        assert.ok(!canTransition('doctor', terminal, to))
        assert.ok(!canTransition('patient', terminal, to))
        assert.ok(!canTransition('admin', terminal, to))
      }
    }
  }
})

test('no transition is a no-op; a change must change something', () => {
  for (const role of ['patient', 'doctor', 'admin']) {
    for (const status of ALL) {
      assert.ok(!canTransition(role, status, status), `${role}: ${status} -> ${status} must be rejected`)
    }
  }
})

test('every known status appears in the transition tables', () => {
  for (const table of [PROVIDER_TRANSITIONS, PATIENT_TRANSITIONS, ADMIN_TRANSITIONS]) {
    for (const status of ALL) {
      assert.ok(status in table, `${status} missing from the transition table`)
    }
  }
  assert.deepEqual(Object.keys(PROVIDER_TRANSITIONS).sort(), [...ALL].sort())
})

test('patient transitions are always a subset of provider transitions', () => {
  for (const status of ALL) {
    for (const target of PATIENT_TRANSITIONS[status] ?? []) {
      assert.ok(
        (PROVIDER_TRANSITIONS[status] ?? []).includes(target),
        `${status} -> ${target} allowed for a patient but not a provider`,
      )
    }
  }
})

test('an unknown role gets provider rules rather than an open door', () => {
  assert.equal(transitionsFor('someone_new'), PROVIDER_TRANSITIONS)
  assert.equal(transitionsFor(''), PROVIDER_TRANSITIONS)
  assert.ok(!canTransition('', 'pending', 'completed'), 'unknown role must not complete a visit')
})

test('provider roles are recognised, and allied health counts as providers', () => {
  for (const role of [
    'doctor',
    'nurse',
    'pharmacy',
    'laboratory',
    'imaging_center',
    'hospital',
    'ambulance_driver',
    'medical_ngo',
  ]) {
    assert.ok(isProviderRole(role), `${role} should be a provider role`)
  }
  for (const role of ['patient', 'admin', '', 'wizard', 'DOCTOR']) {
    assert.ok(!isProviderRole(role), `${role} should not be a provider role`)
  }
  assert.equal(isPractitionerRole('kinesitherapist'), true)
  assert.equal(isPractitionerRole('doctor'), false, 'doctors have their own catalog table')
  assert.equal(PRACTITIONER_ROLES.length, 7)
  assert.equal(new Set(PROVIDER_ROLES).size, PROVIDER_ROLES.length, 'no duplicate roles')
  assert.equal(PROVIDER_ROLES.length, 15)
})

test('uniqueId produces distinct, prefix-tagged identifiers', () => {
  const ids = new Set<string>()
  for (let i = 0; i < 5_000; i++) ids.add(uniqueId('ap'))
  assert.equal(ids.size, 5_000, 'no collisions across 5k draws')
  assert.ok([...ids][0].startsWith('ap_'))
})
