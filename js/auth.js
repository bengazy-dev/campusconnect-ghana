import { insforge, getUserProfile, db } from "./config.js";

function qs(id) {
  return document.getElementById(id);
}

function showAlert(msg, isErr) {
  var el = qs("auth-alert");
  if (!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
  el.classList.toggle("auth-alert--error", !!isErr);
}

function isSignupMode() {
  return qs("auth-mode") && qs("auth-mode").value === "signup";
}

async function ensureProfileRow(userId, role, extras) {
  var orgName = (extras && extras.orgDisplayName) || null;
  var name = extras && extras.name;
  var { data: existing } = await db.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return;
  var row = {
    id: userId,
    role: role,
    onboarding_complete: role === "organizer",
    org_display_name: role === "organizer" ? orgName : null,
  };
  var { error } = await db.from("profiles").insert([row]);
  if (error) throw error;
  if (name) {
    await insforge.auth.setProfile({ name: name });
  }
}

async function redirectAfterSession() {
  var { data: session, error } = await insforge.auth.getCurrentUser();
  if (error || !session?.user) return;
  var uid = session.user.id;
  var { data: profile, error: pe } = await getUserProfile(uid);
  if (pe || !profile) {
    showAlert("Profile missing. Contact support or complete signup again.", true);
    return;
  }
  if (profile.role === "organizer") {
    window.location.href = "organizer-dashboard.html";
    return;
  }
  if (!profile.onboarding_complete) {
    window.location.href = "onboarding.html";
    return;
  }
  window.location.href = "index.html";
}

async function handleSignIn(email, password, expectedRole) {
  showAlert("");
  var res = await insforge.auth.signInWithPassword({ email: email, password: password });
  if (res.error) {
    if (res.error.statusCode === 403) {
      showAlert("Verify your email first, then sign in.", true);
    } else {
      showAlert(res.error.message || "Sign in failed", true);
    }
    return;
  }
  var { data: profile } = await getUserProfile(res.data.user.id);
  if (!profile) {
    await ensureProfileRow(res.data.user.id, expectedRole, {});
    await redirectAfterSession();
    return;
  }
  if (profile.role !== expectedRole) {
    await insforge.auth.signOut();
    showAlert(
      "This account is registered as " +
        profile.role +
        ". Use the " +
        (profile.role === "student" ? "Student" : "Organizer") +
        " tab.",
      true
    );
    return;
  }
  await redirectAfterSession();
}

async function handleSignUp(email, password, name, expectedRole, orgDisplayName) {
  showAlert("");
  var redirectTo = new URL("login.html", window.location.href).href;
  var res = await insforge.auth.signUp({
    email: email,
    password: password,
    name: name || email.split("@")[0],
    redirectTo: redirectTo,
  });
  if (res.error) {
    showAlert(res.error.message || "Sign up failed", true);
    return;
  }
  if (res.data && res.data.requireEmailVerification) {
    sessionStorage.setItem(
      "cc_verify",
      JSON.stringify({
        email: email,
        role: expectedRole,
        name: name,
        orgDisplayName: orgDisplayName,
        method: res.data.verifyEmailMethod || "code",
      })
    );
    qs("verify-panel").hidden = false;
    qs("auth-forms-wrap").hidden = true;
    qs("verify-email-label").textContent = email;
    showAlert("Enter the code we sent to your email.", false);
    return;
  }
  if (res.data && res.data.user && res.data.accessToken) {
    await ensureProfileRow(res.data.user.id, expectedRole, {
      name: name,
      orgDisplayName: orgDisplayName,
    });
    await redirectAfterSession();
  }
}

async function handleVerifyOtp(otp) {
  var raw = sessionStorage.getItem("cc_verify");
  if (!raw) {
    showAlert("No pending verification.", true);
    return;
  }
  var pending = JSON.parse(raw);
  var res = await insforge.auth.verifyEmail({
    email: pending.email,
    otp: otp,
  });
  if (res.error) {
    showAlert(res.error.message || "Invalid code", true);
    return;
  }
  sessionStorage.removeItem("cc_verify");
  var userId = res.data.user.id;
  await ensureProfileRow(userId, pending.role, {
    name: pending.name,
    orgDisplayName: pending.orgDisplayName,
  });
  await redirectAfterSession();
}

async function boot() {
  var verifyForm = qs("verify-form");
  if (verifyForm) {
    verifyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var otp = (qs("verify-otp") && qs("verify-otp").value) || "";
      handleVerifyOtp(otp.trim());
    });
  }

  var ps = qs("panel-student");
  if (ps) {
    ps.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = qs("student-email").value.trim();
      var password = qs("student-password").value;
      var name = qs("student-name") ? qs("student-name").value.trim() : "";
      if (isSignupMode()) {
        if (!name) {
          showAlert("Please enter your name.", true);
          return;
        }
        handleSignUp(email, password, name, "student", null);
      } else {
        handleSignIn(email, password, "student");
      }
    });
  }

  var po = qs("panel-organizer");
  if (po) {
    po.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = qs("org-email").value.trim();
      var password = qs("org-password").value;
      var name = qs("org-name") ? qs("org-name").value.trim() : "";
      var orgDisplay = qs("org-display-name") ? qs("org-display-name").value.trim() : "";
      if (isSignupMode()) {
        if (!name) {
          showAlert("Please enter your name.", true);
          return;
        }
        if (!orgDisplay) {
          showAlert("Please enter your organization name.", true);
          return;
        }
        handleSignUp(email, password, name, "organizer", orgDisplay);
      } else {
        handleSignIn(email, password, "organizer");
      }
    });
  }

  try {
    var { data: session } = await insforge.auth.getCurrentUser();
    if (session?.user) {
      await redirectAfterSession();
    }
  } catch (err) {
    console.error(err);
    showAlert(
      "Could not reach InsForge. Use http://localhost (not file://), check js/insforge-env.js, and your network.",
      true
    );
  }
}

boot();
