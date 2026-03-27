/** Maps a login username to the synthetic email stored for Better Auth’s user row. */
export function syntheticEmailFromUsername(username: string): string {
  return `${username.trim().toLowerCase()}@users.local`;
}

/** Allowed characters match Better Auth’s default username validator. */
export const USERNAME_REGEX = /^[a-zA-Z0-9_.]+$/;
