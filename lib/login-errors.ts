/** Maps Better Auth / API messages to user-facing login copy. */
export function mapLoginErrorMessage(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (
    m.includes("deactivat") ||
    m.includes("inactive") ||
    m.includes("account_deactivated") ||
    m.includes("contact an administrator")
  ) {
    return "Your account is deactivated. Please contact an administrator.";
  }
  if (
    m.includes("invalid") &&
    (m.includes("password") || m.includes("username") || m.includes("credential"))
  ) {
    return "Invalid username or password.";
  }
  if (m.includes("too many") || m.includes("rate")) {
    return "Too many attempts. Please wait and try again.";
  }
  return message?.trim() || "Could not sign in. Please try again.";
}
