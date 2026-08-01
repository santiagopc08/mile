#ifndef PLATFORM_ENGINE_TERRAIN_OBSTACLE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_OBSTACLE_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class ObstacleType
    {
        Rock,
        Crate,
        Barrel,
        Hazard
    };

    struct ObstacleSettingsComponent
    {
        ObstacleType type{ObstacleType::Rock};
        float probability{0.2f};
        bool dynamic{true};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_OBSTACLE_SETTINGS_COMPONENT_HPP
