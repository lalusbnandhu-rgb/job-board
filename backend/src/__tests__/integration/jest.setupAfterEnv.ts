/**
 * Runs after Jest is installed in the environment.
 * jest.mock is available here — we bypass all rate limiters so
 * integration tests can login/register freely without hitting limits.
 *
 * NOTE: The factory function must be self-contained — jest.mock is hoisted
 * to the top of the file by ts-jest, so any variables referenced in the
 * factory must be defined *inside* the factory, not in outer scope.
 */
jest.mock('../../middleware/rate-limit', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pass = (_req: any, _res: any, next: any) => next();
  return {
    loginLimiter: pass,
    registerLimiter: pass,
    passwordLimiter: pass,
    uploadLimiter: pass,
    applicationLimiter: pass,
    jobCreateLimiter: pass,
  };
});
