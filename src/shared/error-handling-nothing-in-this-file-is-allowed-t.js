/* Error handling: nothing in this file is allowed to fail silently.
   store.get / store.set - saved settings (localStorage). Blocked storage (private window, cleared site data) is expected and
                           tolerated; corrupt saved data is reported and ignored.
   logWarn(what, e)      - optional browser features (wake lock, vibration, fullscreen, audio...): a failure is logged, never fatal. */
