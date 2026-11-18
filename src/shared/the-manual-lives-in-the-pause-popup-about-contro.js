/* ---------- the manual lives in the pause popup: About / Controls / Operations tabs ---------- */
let docsOpen = false; /* the old full-screen manual is gone; kept so older checks still read false */
function toggleDocs() {
  if (pmOpen && INFO_TABS.includes(pmTab)) pmShow(false);
  else pmShow(true, pmInfo);
}
