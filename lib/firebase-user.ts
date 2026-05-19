import type { User } from "firebase/auth";

/** True on the account's first successful sign-in (email signup or new Google account). */
export function isNewFirebaseUser(user: User): boolean {
  const { creationTime, lastSignInTime } = user.metadata;
  if (!creationTime || !lastSignInTime) return false;
  return creationTime === lastSignInTime;
}
