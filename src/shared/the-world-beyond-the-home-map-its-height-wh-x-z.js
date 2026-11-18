/* ---------- the world beyond the home map: its height, WH(x, z) ----------
   Open sea round the home map, then land and sea out to 50 km, made the same way as the home terrain (the same noise, the same shape: low
   beaches rising to mountains) but with its own seed and a very large-scale bias so there are real seas between the lands. It is a pure
   function of x and z, so every region is identical every time you fly there, and it is what the ground collision uses too. */
