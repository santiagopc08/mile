#ifndef PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct FixedTickSettingsComponent
    {
        uint32_t tickRate{60};          // 30, 60, 120, 240 Hz
        uint32_t maxCatchUpTicks{8};
        bool deterministic{true};
        bool interpolationEnabled{true};
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_SETTINGS_COMPONENT_HPP
