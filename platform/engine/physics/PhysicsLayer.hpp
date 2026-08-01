#ifndef PLATFORM_ENGINE_PHYSICS_PHYSICS_LAYER_HPP
#define PLATFORM_ENGINE_PHYSICS_PHYSICS_LAYER_HPP

#include <cstdint>

namespace platform
{
    enum class PhysicsLayer : uint16_t
    {
        Default     = 1 << 0,
        Terrain     = 1 << 1,
        Vehicle     = 1 << 2,
        Collectible = 1 << 3,
        Sensor      = 1 << 4,
        UI          = 1 << 5,
        All         = 0xFFFF
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_PHYSICS_LAYER_HPP
