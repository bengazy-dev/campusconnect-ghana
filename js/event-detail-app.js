import { insforge, getUserProfile, getEventById, toggleSaveEvent, isEventSaved } from "./config.js";
import { scoreEvent } from "./matching.js";
import { applyNavForRole } from "./session.js";
import { escapeHtml, formatDate } from "./utils.js";

function getQueryId() {
  var q = new URLSearchParams(window.location.search).get("id");
  return q && q.trim() ? q.trim() : null;
}

async function boot() {
  var id = getQueryId();
  if (!id) {
    document.body.innerHTML =
      '<main class="page"><p class="muted" style="padding:2rem;">Missing event id.</p></main>';
    return;
  }

  var u = await insforge.auth.getCurrentUser();
  if (u.error || !u.data?.user) {
    window.location.href = "login.html";
    return;
  }

  await applyNavForRole();

  var pr = await getUserProfile(u.data.user.id);
  if (pr.data && pr.data.role === "student" && !pr.data.onboarding_complete) {
    window.location.href = "onboarding.html";
    return;
  }

  var { data: ev, error } = await getEventById(id);
  if (error || !ev) {
    var main = document.querySelector("main");
    if (main) {
      main.innerHTML =
        '<p class="muted" style="padding:2rem;">Event not found.</p>';
    }
    return;
  }

  var profile = pr.data;
  var score = profile && profile.role === "student" ? scoreEvent(profile, ev) : null;

  var titleEl = document.getElementById("event-title");
  var orgEl = document.getElementById("event-org");
  var catEl = document.getElementById("event-category");
  var matchEl = document.getElementById("event-match");
  var deadlineEl = document.getElementById("event-deadline");
  var descEl = document.getElementById("event-desc");
  var eligEl = document.getElementById("event-elig");
  var locEl = document.getElementById("event-location");
  var tagsEl = document.getElementById("event-tags");
  var applyEl = document.getElementById("event-apply");

  if (titleEl) titleEl.textContent = ev.title;
  if (orgEl) orgEl.textContent = ev.organization;
  if (catEl) catEl.textContent = ev.category;
  if (matchEl) {
    if (score != null) {
      matchEl.textContent = score + "% match for your profile";
      matchEl.hidden = false;
    } else if (profile && profile.role === "organizer") {
      matchEl.textContent = "Organizer view";
      matchEl.hidden = false;
    } else {
      matchEl.hidden = true;
    }
  }
  if (deadlineEl) {
    deadlineEl.innerHTML = ev.deadline
      ? "<strong class=\"text-highlight\">" + escapeHtml(formatDate(ev.deadline)) + "</strong>"
      : "<strong class=\"text-highlight\">See organizer site</strong>";
  }
  if (descEl) descEl.textContent = ev.description || "";
  if (eligEl) {
    var elig = ev.eligibility || "";
    if (!elig) {
      eligEl.innerHTML = "<p class=\"muted\">Not specified.</p>";
    } else if (elig.indexOf("\n") >= 0) {
      eligEl.innerHTML =
        "<ul class=\"detail-list\"><li>" +
        escapeHtml(elig)
          .split(/\n+/)
          .filter(Boolean)
          .join("</li><li>") +
        "</li></ul>";
    } else {
      eligEl.innerHTML = "<p class=\"muted\">" + escapeHtml(elig) + "</p>";
    }
  }
  if (locEl) {
    locEl.innerHTML = ev.location
      ? "<ul class=\"detail-list\"><li>" + escapeHtml(ev.location) + "</li></ul>"
      : "<p class=\"muted\">Not specified.</p>";
  }
  if (tagsEl) {
    var tags = ev.tags || [];
    tagsEl.innerHTML = tags
      .map(function (t) {
        return '<span class="chip chip--static is-selected">' + escapeHtml(t) + "</span>";
      })
      .join("");
  }
  if (applyEl) {
    if (ev.url) {
      applyEl.href = ev.url;
      applyEl.removeAttribute("aria-disabled");
    } else {
      applyEl.href = "#";
      applyEl.setAttribute("aria-disabled", "true");
    }
  }

  var btn = document.getElementById("btn-save");
  if (btn) {
    if (!profile || profile.role !== "student") {
      btn.hidden = true;
    } else {
      var savedState = await isEventSaved(ev.id);
      if (savedState.data) {
        btn.textContent = "Saved ✓";
        btn.disabled = true;
      }
      btn.addEventListener("click", async function () {
        var r = await toggleSaveEvent(ev.id);
        if (r.error) {
          alert(r.error.message || "Could not update save");
          return;
        }
        if (r.data && r.data.saved) {
          btn.textContent = "Saved ✓";
          btn.disabled = true;
        } else {
          btn.textContent = "Save for later";
          btn.disabled = false;
        }
      });
    }
  }
}

boot();
