#ifndef PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct CollectibleRuntimeComponent
    {
        bool collected{false};
        double collectedTime{0.0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_RUNTIME_COMPONENT_HPP
