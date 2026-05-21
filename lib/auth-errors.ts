import { FirebaseError } from "firebase/app";
import type { Dictionary } from "@/lib/i18n/types";

const CODE_TO_KEY: Record<string, keyof Dictionary["auth"]["errors"]> = {
  "auth/email-already-in-use": "emailInUse",
  "auth/invalid-email": "invalidEmail",
  "auth/operation-not-allowed": "operationNotAllowed",
  "auth/weak-password": "weakPassword",
  "auth/user-disabled": "userDisabled",
  "auth/user-not-found": "userNotFound",
  "auth/wrong-password": "wrongPassword",
  "auth/invalid-credential": "wrongPassword",
  "auth/too-many-requests": "tooManyRequests",
  "auth/popup-closed-by-user": "popupClosed",
  "auth/account-exists-with-different-credential": "accountExistsDifferent",
  "auth/network-request-failed": "network",
};

export function getAuthErrorMessage(
  error: unknown,
  errors: Dictionary["auth"]["errors"],
): string {
  if (error instanceof FirebaseError) {
    const key = CODE_TO_KEY[error.code];
    if (key) return errors[key];
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return errors.generic;
}
