#ifndef PLATFORM_ENGINE_GAMEPLAY_HAZARDS_HAZARD_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_HAZARDS_HAZARD_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class HazardType
    {
        Spikes,
        Lava,
        Electricity,
        FallingObject,
        InstantDeath,
        DamageOverTime
    };

    struct HazardSettingsComponent
    {
        uint32_t hazardID{0};
        HazardType type{HazardType::Spikes};
        float damageAmount{100.0f};
        bool instantKill{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_HAZARDS_HAZARD_SETTINGS_COMPONENT_HPP
