/**
 * Optional: creates student + organizer test users via InsForge Auth.
 * Requires: npm install
 * Env (optional): INSFORGE_URL, INSFORGE_ANON_KEY
 *
 * If your project enforces email verification, complete verification in the
 * dashboard or temporarily disable it for local testing — then run this script.
 */
import { createClient } from "@insforge/sdk";

const baseUrl = (process.env.INSFORGE_URL || "https://jwynn43g.us-east.insforge.app").replace(
  /\/$/,
  ""
);
const anonKey = process.env.INSFORGE_ANON_KEY || "ik_13c66ce60e8dcbdadd894c54383d5c98";

const insforge = createClient({ baseUrl, anonKey });

const ACCOUNTS = [
  {
    email: "student.test@campusconnect.local",
    password: "CampusTestStudent!8",
    name: "Test Student",
    role: "student",
    orgDisplayName: null,
  },
  {
    email: "organizer.test@campusconnect.local",
    password: "CampusTestOrganizer!8",
    name: "Test Organizer",
    role: "organizer",
    orgDisplayName: "Test NGO Accra",
  },
];

async function ensureProfile(userId, role, name, orgDisplayName) {
  const { data: row } = await insforge.database
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (row) {
    console.log("  profile already exists:", userId);
    return;
  }
  const { error } = await insforge.database.from("profiles").insert([
    {
      id: userId,
      role,
      onboarding_complete: role === "organizer",
      org_display_name: role === "organizer" ? orgDisplayName : null,
    },
  ]);
  if (error) throw error;
  if (name) {
    await insforge.auth.setProfile({ name });
  }
  console.log("  profile row created");
}

async function main() {
  for (const a of ACCOUNTS) {
    console.log("---", a.email);
    const signUp = await insforge.auth.signUp({
      email: a.email,
      password: a.password,
      name: a.name,
      redirectTo: baseUrl + "/login",
    });

    if (signUp.error) {
      console.log("  signUp:", signUp.error.message);
      const signIn = await insforge.auth.signInWithPassword({
        email: a.email,
        password: a.password,
      });
      if (signIn.error) {
        console.log("  signIn:", signIn.error.message);
        continue;
      }
      await ensureProfile(signIn.data.user.id, a.role, a.name, a.orgDisplayName);
      await insforge.auth.signOut();
      continue;
    }

    if (signUp.data?.requireEmailVerification) {
      console.log(
        "  Email verification required — verify this address in InsForge, then re-run or finish signup in the browser."
      );
      continue;
    }

    if (signUp.data?.user?.id) {
      await ensureProfile(signUp.data.user.id, a.role, a.name, a.orgDisplayName);
      await insforge.auth.signOut();
      console.log("  ok");
    }
  }
  console.log("\nDone. See TEST_ACCOUNTS.txt for passwords.");
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
