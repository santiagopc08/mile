#ifndef PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct DestructibleRuntimeComponent
    {
        uint32_t currentHitPoints{1};
        bool destroyed{false};
    };
}

#endif // PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_RUNTIME_COMPONENT_HPP
