#ifndef PLATFORM_ENGINE_TERRAIN_OBSTACLE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_OBSTACLE_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct ObstacleRuntimeComponent
    {
        bool active{true};
        bool generated{true};
        uint32_t ownerChunk{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_OBSTACLE_RUNTIME_COMPONENT_HPP
