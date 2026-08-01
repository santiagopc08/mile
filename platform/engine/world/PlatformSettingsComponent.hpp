#ifndef PLATFORM_ENGINE_WORLD_PLATFORM_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_PLATFORM_SETTINGS_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>
#include <vector>

namespace platform
{
    enum class PlatformMotionType
    {
        Linear,
        Circular,
        Bezier,
        Timeline
    };

    enum class PlatformMotionMode
    {
        Loop,
        PingPong,
        OneShot,
        Timeline
    };

    struct PlatformSettingsComponent
    {
        uint32_t platformID{0};
        PlatformMotionType motionType{PlatformMotionType::Linear};
        PlatformMotionMode motionMode{PlatformMotionMode::PingPong};
        float speed{2.0f};
        std::vector<glm::vec2> waypoints{};
    };
}

#endif // PLATFORM_ENGINE_WORLD_PLATFORM_SETTINGS_COMPONENT_HPP
