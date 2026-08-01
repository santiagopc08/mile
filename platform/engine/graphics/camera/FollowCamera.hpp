#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_FOLLOW_CAMERA_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_FOLLOW_CAMERA_HPP

#include "engine/graphics/Camera2D.hpp"
#include <glm/glm.hpp>

namespace platform
{
    struct CameraFollowConfig
    {
        glm::vec2 TargetOffset{0.0f, -50.0f};
        float LookAheadDistance{0.4f};
        float FollowSpeed{8.0f};
        float VerticalDamping{6.0f};
        float HorizontalDamping{10.0f};
        float MaximumDistance{400.0f};
        float DeadZone{10.0f};
    };

    class FollowCamera
    {
    public:
        explicit FollowCamera(Camera2D &camera, const CameraFollowConfig &config = CameraFollowConfig{});

        void Update(const glm::vec2 &targetPosition, const glm::vec2 &targetVelocity, double dt);

        void SetConfig(const CameraFollowConfig &config) { m_config = config; }
        [[nodiscard]] const CameraFollowConfig &GetConfig() const { return m_config; }
        [[nodiscard]] Camera2D &GetCamera() { return m_camera; }

    private:
        Camera2D &m_camera;
        CameraFollowConfig m_config;
        glm::vec2 m_currentVelocity{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_FOLLOW_CAMERA_HPP
