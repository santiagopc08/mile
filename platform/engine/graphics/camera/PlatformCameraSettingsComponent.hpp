#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_SETTINGS_COMPONENT_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct PlatformCameraSettingsComponent
    {
        glm::vec2 followOffset{0.0f, 1.5f};
        glm::vec2 lookAheadDistance{3.0f, 0.0f};
        float followSpeed{5.0f};
        float verticalLag{0.2f};
        float horizontalLag{0.1f};
        float deadZoneWidth{2.0f};
        float deadZoneHeight{3.0f};
        bool followX{true};
        bool followY{true};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_SETTINGS_COMPONENT_HPP
