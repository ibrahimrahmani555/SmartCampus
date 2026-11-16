export function logRepeatedLoginFailures(email: string, failureCount: number) {
  console.warn(JSON.stringify({
    event: 'repeated_login_failures',
    email: email.trim().toLowerCase(),
    failureCount,
  }))
}
