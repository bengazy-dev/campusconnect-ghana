import { insforge, getUserProfile, db } from "./config.js";
import { scoreEvent } from "./matching.js";
import { applyNavForRole } from "./session.js";
import { escapeHtml, formatDate } from "./utils.js";

async function boot() {
  var u = await insforge.auth.getCurrentUser();
  if (u.error || !u.data?.user) {
    window.location.href = "login.html";
    return;
  }
  var uid = u.data.user.id;
  var pr = await getUserProfile(uid);
  if (!pr.data || pr.data.role !== "student") {
    window.location.href = "organizer-dashboard.html";
    return;
  }
  if (!pr.data.onboarding_complete) {
    window.location.href = "onboarding.html";
    return;
  }

  await applyNavForRole();

  var section = document.querySelector("main section.event-grid");
  if (!section) return;

  var saved = await db.from("saved_events").select("event_id").eq("user_id", uid);

  if (saved.error) {
    section.innerHTML =
      '<p class="muted">Could not load saved items.</p>';
    return;
  }

  var ids = (saved.data || []).map(function (r) {
    return r.event_id;
  });
  if (!ids.length) {
    section.innerHTML = "";
    return;
  }

  var evRes = await db.from("events").select("*").in("id", ids);
  if (evRes.error) {
    section.innerHTML =
      '<p class="muted">Could not load saved events.</p>';
    return;
  }

  var byId = {};
  (evRes.data || []).forEach(function (ev) {
    byId[ev.id] = ev;
  });

  section.innerHTML = ids
    .map(function (eid) {
      var ev = byId[eid];
      if (!ev) return "";
      var sc = scoreEvent(pr.data, ev);
      var meta = ev.deadline
        ? formatDate(ev.deadline)
        : "Date TBC";
      if (ev.location) meta += " · " + escapeHtml(ev.location);
      return (
        '<a class="event-card" href="event.html?id=' +
        encodeURIComponent(ev.id) +
        '">' +
        '<div class="event-card__top"><div><span class="tag">' +
        escapeHtml(ev.category) +
        "</span>" +
        '<h3 class="event-card__title">' +
        escapeHtml(ev.title) +
        "</h3>" +
        '<p class="event-card__org">' +
        escapeHtml(ev.organization) +
        "</p></div>" +
        '<span class="match-pill match-pill--saved">Saved · ' +
        sc +
        "%</span></div>" +
        '<p class="event-card__body">' +
        escapeHtml((ev.description || "").slice(0, 140)) +
        "…</p>" +
        '<p class="event-card__meta">' +
        meta +
        "</p></a>"
      );
    })
    .filter(Boolean)
    .join("");
}

boot();
