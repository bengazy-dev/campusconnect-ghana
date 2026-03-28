import { getUserProfile, insforge } from "./config.js";

/**
 * Hide / show nav items by role. Add class `js-organizer-only` or `js-student-only` on links.
 */
export async function applyNavForRole() {
  var nav = document.getElementById("site-nav");
  if (!nav) return;
  var orgOnly = nav.querySelectorAll(".js-organizer-only");
  var stOnly = nav.querySelectorAll(".js-student-only");
  orgOnly.forEach(function (el) {
    el.hidden = true;
  });
  stOnly.forEach(function (el) {
    el.hidden = true;
  });

  var u = await insforge.auth.getCurrentUser();
  if (u.error || !u.data?.user) {
    stOnly.forEach(function (el) {
      el.hidden = false;
    });
    return;
  }
  var pr = await getUserProfile(u.data.user.id);
  var role = pr.data?.role;
  if (role === "organizer") {
    orgOnly.forEach(function (el) {
      el.hidden = false;
    });
  } else {
    stOnly.forEach(function (el) {
      el.hidden = false;
    });
  }
}
