import { insforge, getUserProfile, db } from "./config.js";
import { applyNavForRole } from "./session.js";

function expandYearRange(ymin, ymax) {
  if (!ymin && !ymax) return null;
  var seq = ["1", "2", "3", "4", "pg"];
  var i0 = ymin ? seq.indexOf(ymin) : 0;
  var i1 = ymax ? seq.indexOf(ymax) : seq.length - 1;
  if (i0 < 0) i0 = 0;
  if (i1 < 0) i1 = seq.length - 1;
  if (i0 > i1) {
    var t = i0;
    i0 = i1;
    i1 = t;
  }
  return seq.slice(i0, i1 + 1);
}

async function boot() {
  var u = await insforge.auth.getCurrentUser();
  if (u.error || !u.data?.user) {
    window.location.href = "login.html";
    return;
  }
  var pr = await getUserProfile(u.data.user.id);
  if (!pr.data || pr.data.role !== "organizer") {
    window.location.href = "index.html";
    return;
  }

  await applyNavForRole();

  var form = document.getElementById("submit-form");
  var status = document.getElementById("submit-status");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (status) {
      status.hidden = false;
      status.textContent = "Publishing…";
    }
    var fd = new FormData(form);
    var tags = fd.getAll("tag");
    var ymin = (fd.get("year_min") || "").toString() || null;
    var ymax = (fd.get("year_max") || "").toString() || null;
    var eligible = expandYearRange(ymin, ymax);

    var row = {
      title: (fd.get("title") || "").toString().trim(),
      category: (fd.get("type") || "").toString(),
      fields_display: tags.length ? tags.join(", ") : null,
      organization: (fd.get("organization") || "").toString().trim(),
      description: (fd.get("description") || "").toString().trim(),
      eligibility: (fd.get("eligibility") || "").toString().trim() || null,
      url: (fd.get("url") || "").toString().trim() || null,
      deadline: (fd.get("deadline") || "").toString() || null,
      location: (fd.get("location") || "").toString().trim() || null,
      tags: tags,
      eligible_years: eligible,
      created_by: u.data.user.id,
    };

    var ins = await db.from("events").insert([row]).select();
    if (ins.error) {
      if (status) status.textContent = ins.error.message || "Could not publish.";
      return;
    }
    if (status) status.textContent = "Published — redirecting…";
    var id = ins.data && ins.data[0] && ins.data[0].id;
    if (id) {
      window.location.href = "event.html?id=" + encodeURIComponent(id);
    } else {
      window.location.href = "organizer-dashboard.html";
    }
  });
}

boot();
