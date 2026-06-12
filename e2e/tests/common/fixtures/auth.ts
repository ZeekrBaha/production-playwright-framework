/**
 * Role/user access for specs. Definitions live in the typed test
 * environment (common/config/test-env.ts).
 */
import { testEnv } from "../config/test-env";

export { NO_AUTH, testEnv } from "../config/test-env";

export const USERS = testEnv.users;
