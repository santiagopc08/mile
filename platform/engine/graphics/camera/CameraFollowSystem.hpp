#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_SYSTEM_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_SYSTEM_HPP

#include "engine/graphics/camera/CameraFollowSettingsComponent.hpp"
#include "engine/graphics/camera/CameraFollowRuntimeComponent.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "engine/gameplay/GameState.hpp"
#include "engine/scene/Registry.hpp"

namespace platform
{
    class CameraFollowSystem
    {
    public:
        CameraFollowSystem() = default;

        void setTarget(CameraFollowSettingsComponent &settings, EntityID target);
        void clearTarget(CameraFollowSettingsComponent &settings);

        void setOffset(CameraFollowSettingsComponent &settings, const glm::vec2 &offset);
        void setDeadZone(CameraFollowSettingsComponent &settings, const glm::vec2 &deadZone);
        void setPrediction(CameraFollowSettingsComponent &settings, float lookAheadDistance);
        void setConstraints(CameraFollowSettingsComponent &settings, const glm::vec4 &constraints);

        void enable(CameraFollowSettingsComponent &settings);
        void disable(CameraFollowSettingsComponent &settings);

        [[nodiscard]] glm::vec2 currentPosition(const CameraFollowRuntimeComponent &runtime) const { return runtime.currentPosition; }
        [[nodiscard]] glm::vec2 targetPosition(const CameraFollowRuntimeComponent &runtime) const { return runtime.desiredPosition; }
        [[nodiscard]] glm::vec2 cameraVelocity(const CameraFollowRuntimeComponent &runtime) const { return runtime.velocity; }

        void Update(Registry &registry, Camera2D &camera, MatchState matchState, double dt);
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_FOLLOW_SYSTEM_HPP
