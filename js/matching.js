/**
 * Relevance score 30–99 from student profile + event row.
 * @param {object | null} profile - profiles row
 * @param {object} event - events row
 */
export function scoreEvent(profile, event) {
  if (!profile || profile.role !== "student") return 55;
  const interests = profile.interests || [];
  const tags = event.tags || [];
  let base = 52;
  if (!tags.length) {
    base = 74;
  } else {
    const overlap = interests.filter(function (i) {
      return tags.indexOf(i) !== -1;
    }).length;
    if (overlap === 0) base = 38;
    else base = 50 + Math.min(overlap * 14, 42);
  }
  if (!yearEligible(profile.year, event.eligible_years)) {
    base -= 18;
  }
  return Math.max(30, Math.min(99, base));
}

/**
 * @param {string | null | undefined} studentYear - "1"|"2"|"3"|"4"|"pg"
 * @param {string[] | null | undefined} eligibleYears
 */
export function yearEligible(studentYear, eligibleYears) {
  if (!eligibleYears || !eligibleYears.length) return true;
  var sy = studentYear || "";
  return eligibleYears.indexOf(sy) !== -1;
}
