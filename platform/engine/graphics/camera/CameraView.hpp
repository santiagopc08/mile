#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_VIEW_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_VIEW_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct CameraView
    {
        glm::vec2 Transform{0.0f, 0.0f};
        glm::mat4 Projection{1.0f};
        glm::vec4 Viewport{0.0f, 0.0f, 1280.0f, 720.0f};
        float NearPlane{-1.0f};
        float FarPlane{1.0f};
        uint32_t VisibilityMask{0xFFFFFFFF};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_VIEW_HPP
