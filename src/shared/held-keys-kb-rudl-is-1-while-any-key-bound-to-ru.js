/* held keys: kb('rudL') is 1 while any key bound to rudL is down */
const kb = (id) => (BI[id].kb.some((c) => keys[c]) ? 1 : 0);
