import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

/** Browser client for username sign-in, sign-out, and session state. */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});
