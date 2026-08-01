#include "engine/graphics/camera/FollowCamera.hpp"
#include <algorithm>

namespace platform
{
    FollowCamera::FollowCamera(Camera2D &camera, const CameraFollowConfig &config)
        : m_camera(camera), m_config(config)
    {
    }

    void FollowCamera::Update(const glm::vec2 &targetPosition, const glm::vec2 &targetVelocity, double dt)
    {
        float frameDt = static_cast<float>(dt);
        if (frameDt <= 0.0f)
        {
            return;
        }

        // Calculate desired camera position: target + offset + lookahead
        glm::vec2 lookAhead = targetVelocity * m_config.LookAheadDistance;
        glm::vec2 desiredPos = targetPosition + m_config.TargetOffset + lookAhead;

        glm::vec2 currentPos = m_camera.GetPosition();
        glm::vec2 diff = desiredPos - currentPos;

        // Apply deadzone threshold
        if (glm::length(diff) < m_config.DeadZone)
        {
            diff = glm::vec2(0.0f, 0.0f);
        }

        // Smooth damping on horizontal and vertical axes
        float lerpX = 1.0f - std::exp(-m_config.HorizontalDamping * frameDt);
        float lerpY = 1.0f - std::exp(-m_config.VerticalDamping * frameDt);

        glm::vec2 newPos;
        newPos.x = currentPos.x + diff.x * lerpX;
        newPos.y = currentPos.y + diff.y * lerpY;

        m_camera.SetPosition(newPos);
    }
}
