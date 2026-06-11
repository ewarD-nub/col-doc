# Authentication

Authentication verifies a user's identity before granting access to any document or API endpoint.

## Functional Requirements

1. Users must be able to sign up with a unique username, a valid email address, and a password.
   - Email ownership must be confirmed via a one-time code before the account is activated.
2. Users must be able to log in using either their username or email address together with their password.
3. Users must be able to log in using their email address alone via a magic link / OTP sent to that address.
4. Users must be able to log out, which invalidates the current session immediately.
5. Authenticated state must persist across browser refreshes for a configurable duration (default: 7 days) using a refresh token stored in an HTTP-only cookie.
6. The access token (JWT) must expire after a short window (e.g. 15 minutes); a refresh token is used to silently reissue it without re-login.

## Non-Functional Requirements

1. Passwords must be hashed with a memory-hard algorithm (Argon2id) before storage — never stored in plaintext.
2. All authentication endpoints must be rate-limited to prevent brute-force attacks.
3. JWTs must be signed with a secret key loaded from an environment variable, never hard-coded.
4. Refresh tokens must be rotated on every use, with server-side reuse detection to invalidate the token family on theft.

## TODOs

- [ ] Implement `POST /api/auth/signup` — hash password with Argon2id, persist user, send email verification code
- [ ] Implement `POST /api/auth/login` — verify credentials, issue short-lived access token + HTTP-only refresh token
- [ ] Implement `POST /api/auth/refresh` — validate and rotate the refresh token, reissue access token
- [ ] Implement `POST /api/auth/logout` — invalidate the refresh token server-side
- [ ] Implement email OTP / magic-link login flow
- [ ] Add rate-limiting middleware on all auth routes
- [ ] Wire JWT extraction middleware into all protected API and WebSocket routes
- [ ] Add `jwt_secret` and token TTL values to the `Config` struct (loaded from env)
