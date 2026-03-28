export function escapeHtml(s) {
  if (s == null || s === "") return "";
  var d = document.createElement("div");
  d.textContent = String(s);
  return d.innerHTML;
}

export function formatDate(iso) {
  if (!iso) return "Date TBC";
  try {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return iso;
  }
}
