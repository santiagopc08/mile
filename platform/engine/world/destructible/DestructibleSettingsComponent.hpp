#ifndef PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct DestructibleSettingsComponent
    {
        uint32_t hitPoints{1};
        bool spawnDebris{true};
    };
}

#endif // PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_SETTINGS_COMPONENT_HPP
