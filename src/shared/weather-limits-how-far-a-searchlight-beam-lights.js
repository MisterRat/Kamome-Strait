/* weather limits: how far a searchlight beam lights a target (fog and rain eat it; a cloud stops it and only the cloud's underside glows),
   and how far the gun crews can see by day */
const AAV = { clear: 8000, partly: 8000, overcast: 6000, rain: 3000, storm: 1500, fog: 300 };
