# Kamome Strait

The P-51 Mustang flight sim and the PCE-842 Patrol Craft Escort in one WWII South Pacific world. Fly the Mustang or command the ship; later, more simulators and multiplayer in the same world.

**Status:** planning and restructuring. No playable Kamome Strait build yet. The two games it grows from:

- [P-51 Mustang FS](https://github.com/MisterRat/P51-Mustang-FS)
- [PCE-842 Patrol Craft Escort](https://github.com/MisterRat/PCE-842_Patrol_Craft) (alpha)

## Building

Every game is built from shared source pieces with plain Node (no dependencies):

```
node build.js            # writes build/P-51_Mustang_FS.html and build/PCE-842.html
node build.js --check    # also compares them byte for byte with baseline/
```

`src/shared/` holds code every game uses, `src/<game>/` what only that game has, and `src/<game>.manifest` the order the pieces are joined in. The plan is in [PLAN_Kamome-Strait.md](PLAN_Kamome-Strait.md). `Blueprints/` holds diagrams generated from the models.

## License

[PolyForm Noncommercial 1.0.0](LICENSE)
