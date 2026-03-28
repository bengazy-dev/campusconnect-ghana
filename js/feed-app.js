import { insforge, getUserProfile, getAllEvents } from "./config.js";
import { scoreEvent } from "./matching.js";
import { applyNavForRole } from "./session.js";
import { escapeHtml, formatDate } from "./utils.js";

async function requireStudentFeed() {
  var u = await insforge.auth.getCurrentUser();
  if (u.error || !u.data?.user) {
    window.location.href = "login.html";
    return null;
  }
  var pr = await getUserProfile(u.data.user.id);
  if (!pr.data) {
    window.location.href = "login.html";
    return null;
  }
  if (pr.data.role === "organizer") {
    window.location.href = "organizer-dashboard.html";
    return null;
  }
  if (!pr.data.onboarding_complete) {
    window.location.href = "onboarding.html";
    return null;
  }
  return pr.data;
}

function renderFeed(profile, events) {
  var root = document.getElementById("feed-root");
  if (!root) return;
  var scored = events
    .map(function (ev) {
      return { ev: ev, score: scoreEvent(profile, ev) };
    })
    .sort(function (a, b) {
      return b.score - a.score;
    });

  root.innerHTML = scored
    .map(function (item) {
      var ev = item.ev;
      var sc = item.score;
      var meta = ev.deadline
        ? "Apply by " + formatDate(ev.deadline)
        : "Rolling / see details";
      if (ev.location) meta += " · " + escapeHtml(ev.location);
      return (
        '<a class="event-card" href="event.html?id=' +
        encodeURIComponent(ev.id) +
        '" data-type="' +
        escapeHtml(ev.category) +
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
        '<span class="match-pill" title="Match score">' +
        sc +
        "% match</span></div>" +
        '<p class="event-card__body">' +
        escapeHtml((ev.description || "").slice(0, 160)) +
        (ev.description && ev.description.length > 160 ? "…" : "") +
        "</p>" +
        '<p class="event-card__meta">' +
        meta +
        "</p></a>"
      );
    })
    .join("");

  var filters = document.querySelectorAll("#feed-filters .chip");
  var feedRoot = root;
  filters.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      filters.forEach(function (c) {
        c.classList.toggle("is-selected", c === chip);
      });
      feedRoot.querySelectorAll(".event-card").forEach(function (card) {
        var t = card.getAttribute("data-type");
        var show = f === "all" || t === f;
        card.style.display = show ? "" : "none";
      });
    });
  });
}

function updateHero(profile, events, topScore) {
  var count = events.length;
  var lead = document.querySelector(".page-hero .lead strong.text-highlight");
  if (lead && profile) {
    var ints = (profile.interests || []).slice(0, 3).join(" · ") || "your interests";
    var yr = profile.year ? "Year " + profile.year : "your year";
    lead.textContent = ints + " · " + yr;
  }
  var pills = document.querySelectorAll(".hero-stats .stat-pill__value");
  if (pills[0]) pills[0].innerHTML = String(count) + "<span>+</span>";
  if (pills[1]) pills[1].innerHTML = String(topScore || 0) + "<span>%</span>";
  if (pills[2] && count) {
    var cats = new Set();
    events.forEach(function (e) {
      cats.add(e.category);
    });
    pills[2].textContent = String(cats.size);
  } else if (pills[2]) {
    pills[2].textContent = "0";
  }
}

async function boot() {
  var profile = await requireStudentFeed();
  if (!profile) return;

  await applyNavForRole();

  var { data: events, error } = await getAllEvents();
  if (error) {
    var root = document.getElementById("feed-root");
    if (root) {
      root.innerHTML =
        '<p class="muted">Could not load events. Check InsForge config and that <code>schema.sql</code> was applied.</p>';
    }
    return;
  }

  var topScore = 0;
  if (events.length) {
    topScore = Math.max.apply(
      null,
      events.map(function (e) {
        return scoreEvent(profile, e);
      })
    );
  }
  updateHero(profile, events, topScore);
  renderFeed(profile, events);
}

boot();
