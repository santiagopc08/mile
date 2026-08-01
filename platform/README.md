# Platform

Platform is an interactive application runtime written in C++23.

## Requirements

- C++23 compliant compiler (GCC 13+, Clang 16+, MSVC 2022+)
- CMake >= 3.28
- Ninja (recommended)

## Building

```bash
cmake --preset debug
cmake --build --preset debug
```

The resulting executable `hill_climb` will be generated in `build/debug/bin/`.

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
