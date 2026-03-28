import { insforge, getUserProfile, db } from "./config.js";
import { applyNavForRole } from "./session.js";

async function boot() {
  var u = await insforge.auth.getCurrentUser();
  if (u.error || !u.data?.user) {
    window.location.href = "login.html";
    return;
  }
  var uid = u.data.user.id;
  var pr = await getUserProfile(uid);
  if (!pr.data) {
    window.location.href = "login.html";
    return;
  }
  if (pr.data.role === "organizer") {
    window.location.href = "organizer-dashboard.html";
    return;
  }
  if (pr.data.onboarding_complete) {
    window.location.href = "index.html";
    return;
  }

  await applyNavForRole();

  var form = document.getElementById("onboarding-form");
  if (!form) return;

  form.setAttribute("action", "#");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var interests = fd.getAll("interest");
    var formats = fd.getAll("format");
    var patch = {
      institution: (fd.get("institution") || "").toString().trim(),
      course: (fd.get("course") || "").toString().trim(),
      year: (fd.get("year") || "").toString(),
      campus: (fd.get("campus") || "").toString().trim() || null,
      interests: interests,
      goals: (fd.get("goals") || "").toString().trim() || null,
      preferred_formats: formats,
      onboarding_complete: true,
    };
    var { error } = await db.from("profiles").update(patch).eq("id", uid);
    if (error) {
      alert(error.message || "Could not save profile");
      return;
    }
    window.location.href = "index.html";
  });
}

boot();
