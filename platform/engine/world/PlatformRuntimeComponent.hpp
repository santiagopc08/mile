#ifndef PLATFORM_ENGINE_WORLD_PLATFORM_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_PLATFORM_RUNTIME_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    struct PlatformRuntimeComponent
    {
        uint32_t currentWaypoint{0};
        float progress{0.0f};
        int direction{1}; // +1 or -1
        glm::vec2 currentPosition{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_WORLD_PLATFORM_RUNTIME_COMPONENT_HPP
