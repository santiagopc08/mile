#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_SETTINGS_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>
#include <vector>

namespace platform
{
    enum class CameraInterpolation
    {
        Linear,
        SmoothStep,
        EaseIn,
        EaseOut,
        EaseInOut,
        Bezier
    };

    struct CameraKeyframe
    {
        double timestamp{0.0};
        glm::vec2 position{0.0f, 0.0f};
        float zoom{1.0f};
        float rotation{0.0f};
        float shakeIntensity{0.0f};
        CameraInterpolation interpolation{CameraInterpolation::Linear};
    };

    struct CameraTimelineSettingsComponent
    {
        std::vector<CameraKeyframe> keyframes{};
        double duration{10.0};
        bool looping{false};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_SETTINGS_COMPONENT_HPP
