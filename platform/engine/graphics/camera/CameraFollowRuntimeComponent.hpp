#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_RUNTIME_COMPONENT_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct CameraFollowRuntimeComponent
    {
        glm::vec2 desiredPosition{0.0f, 0.0f};
        glm::vec2 currentPosition{0.0f, 0.0f};
        glm::vec2 velocity{0.0f, 0.0f};
        bool targetVisible{true};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_RUNTIME_COMPONENT_HPP
