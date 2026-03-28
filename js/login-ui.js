/**
 * Login page UI only (no InsForge). Student/Organizer tabs and sign-in vs sign-up
 * (toggle under the primary button) work even if the ES module layer is slow or fails.
 */
(function () {
  function qs(id) {
    return document.getElementById(id);
  }

  function isSignupMode() {
    var m = qs("auth-mode");
    return m && m.value === "signup";
  }

  function syncSignupFields() {
    var signup = isSignupMode();
    document.querySelectorAll(".js-signup-field").forEach(function (el) {
      el.hidden = !signup;
    });
    var orgRow = qs("org-signup-row");
    if (orgRow) {
      var tabOrg = qs("tab-organizer");
      var orgTab = tabOrg && tabOrg.getAttribute("aria-selected") === "true";
      orgRow.hidden = !signup || !orgTab;
    }
    var sb = qs("student-submit-btn");
    var ob = qs("org-submit-btn");
    if (sb) sb.textContent = signup ? "Create student account" : "Sign in";
    if (ob) ob.textContent = signup ? "Create organizer account" : "Sign in";
    document.querySelectorAll(".js-toggle-auth-mode").forEach(function (btn) {
      btn.textContent = signup ? "Sign in" : "Sign up";
    });
    var tabOrg2 = qs("tab-organizer");
    var orgTabOn = tabOrg2 && tabOrg2.getAttribute("aria-selected") === "true";
    var sn = qs("student-name");
    if (sn) sn.required = signup;
    var on = qs("org-name");
    if (on) on.required = signup;
    var od = qs("org-display-name");
    if (od) od.required = signup && orgTabOn;
  }

  function initTabs() {
    var wrap = qs("auth-forms-wrap");
    var panelStudent = qs("panel-student");
    var panelOrganizer = qs("panel-organizer");
    if (!wrap || !panelStudent || !panelOrganizer) return;

    function activateTab(tabEl) {
      if (!tabEl || tabEl.getAttribute("role") !== "tab") return;
      var isOrg = tabEl.id === "tab-organizer";
      wrap.querySelectorAll(".tabs [role='tab']").forEach(function (t) {
        t.setAttribute("aria-selected", t === tabEl ? "true" : "false");
      });
      panelStudent.hidden = isOrg;
      panelOrganizer.hidden = !isOrg;
      syncSignupFields();
    }

    wrap.addEventListener("click", function (e) {
      var tabBtn = e.target && e.target.closest ? e.target.closest(".tabs [role='tab']") : null;
      if (!tabBtn || !wrap.contains(tabBtn)) return;
      e.preventDefault();
      activateTab(tabBtn);
    });

    wrap.querySelectorAll(".tabs [role='tab']").forEach(function (tab) {
      tab.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
        ev.preventDefault();
        var tabs = Array.prototype.slice.call(wrap.querySelectorAll(".tabs [role='tab']"));
        var i = tabs.indexOf(tab);
        if (i < 0) return;
        var next = ev.key === "ArrowRight" ? tabs[i + 1] : tabs[i - 1];
        if (next) {
          next.focus();
          activateTab(next);
        }
      });
    });
  }

  function initAuthModeToggle() {
    var modeInput = qs("auth-mode");
    if (!modeInput) return;
    document.querySelectorAll(".js-toggle-auth-mode").forEach(function (btn) {
      btn.addEventListener("click", function () {
        modeInput.value = isSignupMode() ? "signin" : "signup";
        syncSignupFields();
      });
    });
  }

  function initVerifyCancel() {
    var cancelVerify = qs("verify-cancel");
    if (cancelVerify) {
      cancelVerify.addEventListener("click", function () {
        try {
          sessionStorage.removeItem("cc_verify");
        } catch (err) {}
        var vp = qs("verify-panel");
        var aw = qs("auth-forms-wrap");
        var al = qs("auth-alert");
        if (vp) vp.hidden = true;
        if (aw) aw.hidden = false;
        if (al) {
          al.hidden = true;
          al.textContent = "";
        }
      });
    }
  }

  function boot() {
    initTabs();
    initAuthModeToggle();
    initVerifyCancel();
    syncSignupFields();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
