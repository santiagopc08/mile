#ifndef PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class CollectibleType : uint8_t
    {
        Coin = 0,
        Fuel,
        Checkpoint,
        PowerUp,
        Artifact
    };

    enum class CollectibleState : uint8_t
    {
        Spawned = 0,
        Visible,
        Collected,
        PendingDestroy
    };

    struct CollectibleComponent
    {
        CollectibleType Type{CollectibleType::Coin};
        CollectibleState State{CollectibleState::Spawned};
        float Value{10.0f}; // Amount (e.g. 10 coins or 25 fuel)
        float Radius{25.0f}; // Trigger radius
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_COMPONENT_HPP
