export const PASSWORD_MIN_LENGTH = 6

export function getPasswordIssues(password: string): string[] {
  const issues: string[] = []

  if (password.length < PASSWORD_MIN_LENGTH) {
    issues.push('length')
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('uppercase')
  }
  if (!/\d/.test(password)) {
    issues.push('digit')
  }

  return issues
}

export function getPasswordScore(password: string): number {
  return [
    password.length >= PASSWORD_MIN_LENGTH,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
  ].filter(Boolean).length
}
