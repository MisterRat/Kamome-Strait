/* the player's pilot in his seat (the figure is the shared one, makePilot) */
const plPilot = makePilot();
plPilot.position.set(0, 0.07, -0.33);
plPilot.scale.setScalar(0.95);
model.add(plPilot);
