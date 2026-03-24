import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} from '../../utils/token';

// Ensure env vars required by the token module are set before import
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-32chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-long-enough-32chars';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('generateAccessToken / verifyAccessToken', () => {
  it('signs a token and verifies the payload', () => {
    const token = generateAccessToken('user123', 'seeker');
    const payload = verifyAccessToken(token);

    expect(payload.id).toBe('user123');
    expect(payload.role).toBe('seeker');
  });

  it('embeds different roles correctly', () => {
    const token = generateAccessToken('emp456', 'employer');
    const { role } = verifyAccessToken(token);
    expect(role).toBe('employer');
  });

  it('throws on an invalid token string', () => {
    expect(() => verifyAccessToken('not.a.valid.jwt')).toThrow();
  });

  it('throws on a tampered token', () => {
    const token = generateAccessToken('user123', 'seeker');
    expect(() => verifyAccessToken(token + 'tampered')).toThrow();
  });
});

describe('generateRefreshToken / verifyRefreshToken', () => {
  it('signs and verifies a refresh token', () => {
    const token = generateRefreshToken('user123');
    const payload = verifyRefreshToken(token);
    expect(payload.id).toBe('user123');
  });

  it('throws on invalid refresh token', () => {
    expect(() => verifyRefreshToken('garbage')).toThrow();
  });
});

describe('generateRandomToken', () => {
  it('returns a unique raw token on every call', () => {
    const { raw: a } = generateRandomToken();
    const { raw: b } = generateRandomToken();
    expect(a).not.toBe(b);
  });

  it('returns a 64-char hex raw token', () => {
    const { raw } = generateRandomToken();
    expect(raw).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(raw)).toBe(true);
  });

  it('hashed value matches calling hashToken on the raw value', () => {
    const { raw, hashed } = generateRandomToken();
    expect(hashToken(raw)).toBe(hashed);
  });
});

describe('hashToken', () => {
  it('produces a deterministic SHA-256 hex string', () => {
    expect(hashToken('hello')).toBe(hashToken('hello'));
    expect(hashToken('hello')).not.toBe(hashToken('world'));
  });

  it('produces a 64-char lowercase hex string', () => {
    const result = hashToken('any-input');
    expect(result).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(result)).toBe(true);
  });
});
