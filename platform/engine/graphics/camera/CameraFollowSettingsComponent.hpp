#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_SETTINGS_COMPONENT_HPP

#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>

namespace platform
{
    enum class CameraFollowMode
    {
        Locked,
        SmoothFollow,
        PredictiveFollow,
        InstantSnap
    };

    struct CameraFollowSettingsComponent
    {
        EntityID target{kNullEntity};
        glm::vec2 offset{0.0f, 0.0f};
        float followSpeed{5.0f};
        float lookAheadDistance{50.0f};
        bool followX{true};
        bool followY{true};
        bool enabled{true};
        CameraFollowMode mode{CameraFollowMode::SmoothFollow};

        // Constraints & Dead Zone
        glm::vec4 constraints{-10000.0f, 10000.0f, -10000.0f, 10000.0f}; // minX, maxX, minY, maxY
        glm::vec2 deadZone{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_SETTINGS_COMPONENT_HPP
