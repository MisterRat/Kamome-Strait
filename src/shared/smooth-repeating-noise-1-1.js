/* smooth repeating noise, -1..1 */
const wnz = (t, p) => (Math.sin(t + p) + 0.6 * Math.sin(t * 1.71 + p * 2.3) + 0.8 * Math.sin(t * 0.37 + p * 0.7)) / 2.4;
