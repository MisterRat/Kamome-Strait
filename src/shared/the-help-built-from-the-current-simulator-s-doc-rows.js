/* the help (the Controls tab's tables and the controls box): built from the current simulator's doc rows (its role's kbDoc,
   padDoc: [label, binding ids or text, note, box line, 'box' = box only]); its role's helpBody(box) fills the controls box */
function docValue(row, pad) {
  const v = row[1],
    base = typeof v === 'function' ? v() : typeof v === 'string' ? v : bindText(v, pad);
  return row[2] ? base + ' (' + row[2] + ')' : base;
}
function buildHelp() {
  const tbl = (rows, pad, a, b) => {
    rows = rows.filter((r) => r[4] !== 'box');
    const h = (r) => '<tr><td>' + r[0] + '</td><td>' + docValue(r, pad) + '</td></tr>';
    const half = Math.ceil(rows.length / 2);
    $$(a).innerHTML = rows.slice(0, half).map(h).join('');
    $$(b).innerHTML = rows.slice(half).map(h).join('');
  };
  tbl(SIMS.cur.kbDoc, false, 'kbT1', 'kbT2');
  tbl(SIMS.cur.padDoc, true, 'pdT1', 'pdT2');
  const box = (title, rows, pad, extra) => {
    const lines = {};
    rows.forEach((r) => {
      if (r[3]) (lines[r[3]] = lines[r[3]] || []).push('<b>' + r[0] + '</b> ' + docValue(r, pad));
    });
    return (
      title +
      '<br>' +
      Object.keys(lines)
        .map((k) => lines[k].join(' &middot; '))
        .join('<br>') +
      (extra || '')
    );
  };
  SIMS.cur.helpBody(box);
}
