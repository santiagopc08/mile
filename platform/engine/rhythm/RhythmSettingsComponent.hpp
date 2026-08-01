#ifndef PLATFORM_ENGINE_RHYTHM_RHYTHM_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_RHYTHM_RHYTHM_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct RhythmSettingsComponent
    {
        float bpm{120.0f};
        uint32_t beatsPerMeasure{4};
        uint32_t beatDivision{4};       // 4 = 1/4 (quarter note), 8 = 1/8 (eighth note)
        double startOffset{0.0};
        bool looping{true};
    };
}

#endif // PLATFORM_ENGINE_RHYTHM_RHYTHM_SETTINGS_COMPONENT_HPP
