/* SEA: the world's sea levels, in one place (metres; the world's zero is the home airfield's runway). Every piece that needs the
   level of the sea uses these, never a number of its own. */
const SEA = {
  PAINT: -8 /* the terrain's flat painted water: the land is never lower than this where it is drawn, and the shore shader paints the shallows here */,
  Y: -7.97 /* still water: the ocean's surface, 3 cm above the painted water so the two never fight for the same depth */,
  WL: -8.15 /* a ship's design waterline, as she is placed (her hull sits a little into the still water) */,
  PLANE: -11.8 /* the open-sea plane out to 60 km: under the ocean's troughs and below a ship's keel */,
};
