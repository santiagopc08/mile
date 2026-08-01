#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_RUNTIME_COMPONENT_HPP

#include <glm/glm.hpp>
#include <string>

namespace platform
{
    enum class PlatformCameraMode
    {
        Immediate,
        SmoothFollow,
        PredictiveFollow,
        LockedArea,
        Scripted
    };

    struct PlatformCameraRuntimeComponent
    {
        glm::vec2 desiredPosition{0.0f, 0.0f};
        glm::vec2 smoothedPosition{0.0f, 0.0f};
        glm::vec2 lookAhead{0.0f, 0.0f};
        bool targetVisible{true};
        bool cameraLocked{false};
        PlatformCameraMode mode{PlatformCameraMode::PredictiveFollow};
        std::string activeZone{""};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_RUNTIME_COMPONENT_HPP
