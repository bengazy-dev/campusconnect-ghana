import { insforge, getUserProfile, db } from "./config.js";
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
  if (!pr.data || pr.data.role !== "organizer") {
    window.location.href = "index.html";
    return;
  }

  await applyNavForRole();

  var orgLabel = document.getElementById("dashboard-org");
  if (orgLabel) {
    orgLabel.textContent =
      pr.data.org_display_name || pr.data.institution || "Your organization";
  }

  var tbody = document.querySelector("#dashboard-table tbody");
  if (!tbody) return;

  var res = await db
    .from("events")
    .select("*")
    .eq("created_by", uid)
    .order("created_at", { ascending: false });

  if (res.error) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="muted">Could not load your listings.</td></tr>';
    return;
  }

  var rows = res.data || [];
  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="muted">No opportunities yet — use <strong>Post</strong> to add one.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map(function (ev) {
      var dl = ev.deadline ? formatDate(ev.deadline) : "—";
      return (
        "<tr><td><a href=\"event.html?id=" +
        encodeURIComponent(ev.id) +
        '">' +
        escapeHtml(ev.title) +
        "</a></td><td>" +
        escapeHtml(ev.category) +
        "</td><td>" +
        escapeHtml(dl) +
        '</td><td><a href="event.html?id=' +
        encodeURIComponent(ev.id) +
        '">Open</a></td></tr>'
      );
    })
    .join("");
}

boot();
