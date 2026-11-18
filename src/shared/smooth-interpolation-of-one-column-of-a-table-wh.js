/* smooth interpolation of one column of a table whose first column is z */
const crm = (T, z, c) => {
  let i = 0;
  while (i < T.length - 2 && z > T[i + 1][0]) i++;
  const p0 = T[Math.max(0, i - 1)],
    p1 = T[i],
    p2 = T[i + 1],
    p3 = T[Math.min(T.length - 1, i + 2)],
    h = p2[0] - p1[0],
    u = Math.max(0, Math.min(1, (z - p1[0]) / h)),
    m1 = ((p2[c] - p0[c]) / (p2[0] - p0[0])) * h,
    m2 = ((p3[c] - p1[c]) / (p3[0] - p1[0])) * h,
    u2 = u * u,
    u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p1[c] + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2[c] + (u3 - u2) * m2;
};
function fusSec(z) {
  z = Math.max(FUS_T[0][0], Math.min(FUS_T[FUS_T.length - 1][0], z));
  const t = crm(FUS_T, z, 2),
    b = crm(FUS_T, z, 3);
  return { a: Math.max(0, crm(FUS_T, z, 1)), yc: (t + b) / 2, hh: Math.max(0.01, (t - b) / 2), n: crm(FUS_T, z, 4) };
}
