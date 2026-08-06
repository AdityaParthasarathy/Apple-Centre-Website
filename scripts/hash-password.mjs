// Generates a bcrypt hash to paste into the "Faculty" sheet tab, alongside
// the faculty member's email and name. There's no self-serve signup —
// accounts are provisioned by hand this way.
//
// Usage:
//   node scripts/hash-password.mjs "the-password"

import { hash } from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "<password>"')
  process.exit(1)
}

const passwordHash = await hash(password, 10)
console.log(passwordHash)
