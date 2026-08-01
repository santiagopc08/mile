#ifndef PLATFORM_ENGINE_RHYTHM_RHYTHM_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_RHYTHM_RHYTHM_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct RhythmRuntimeComponent
    {
        uint64_t beatIndex{0};
        uint64_t subdivisionIndex{0};
        uint64_t currentMeasure{1};
        uint64_t currentPhrase{1};
        double songTime{0.0};
        double beatProgress{0.0};
        bool playing{false};
        bool onBeatThisTick{false};
    };
}

#endif // PLATFORM_ENGINE_RHYTHM_RHYTHM_RUNTIME_COMPONENT_HPP
