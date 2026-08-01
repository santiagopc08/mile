#ifndef PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class CollectibleType
    {
        Coin,
        Fuel,
        Key,
        PowerUp,
        Experience
    };

    struct CollectibleSettingsComponent
    {
        CollectibleType type{CollectibleType::Coin};
        float value{10.0f};
        bool respawn{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SETTINGS_COMPONENT_HPP
