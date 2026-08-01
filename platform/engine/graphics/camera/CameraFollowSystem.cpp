#include "engine/graphics/camera/CameraFollowSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void CameraFollowSystem::setTarget(CameraFollowSettingsComponent &settings, EntityID target)
    {
        settings.target = target;
    }

    void CameraFollowSystem::clearTarget(CameraFollowSettingsComponent &settings)
    {
        settings.target = kNullEntity;
    }

    void CameraFollowSystem::setOffset(CameraFollowSettingsComponent &settings, const glm::vec2 &offset)
    {
        settings.offset = offset;
    }

    void CameraFollowSystem::setDeadZone(CameraFollowSettingsComponent &settings, const glm::vec2 &deadZone)
    {
        settings.deadZone = deadZone;
    }

    void CameraFollowSystem::setPrediction(CameraFollowSettingsComponent &settings, float lookAheadDistance)
    {
        settings.lookAheadDistance = lookAheadDistance;
    }

    void CameraFollowSystem::setConstraints(CameraFollowSettingsComponent &settings, const glm::vec4 &constraints)
    {
        settings.constraints = constraints;
    }

    void CameraFollowSystem::enable(CameraFollowSettingsComponent &settings)
    {
        settings.enabled = true;
    }

    void CameraFollowSystem::disable(CameraFollowSettingsComponent &settings)
    {
        settings.enabled = false;
    }

    void CameraFollowSystem::Update(Registry &registry, Camera2D &camera, MatchState matchState, double dt)
    {
        // State Rules:
        // Loading: inactive
        if (matchState == MatchState::Loading)
        {
            return;
        }

        // Paused / Completed / Failed: freeze camera or stop following
        if (matchState == MatchState::Paused || matchState == MatchState::Completed || matchState == MatchState::Failed)
        {
            return;
        }

        float delta = static_cast<float>(dt);
        auto view = registry.GetView<CameraFollowSettingsComponent, CameraFollowRuntimeComponent>();

        view.Each([&registry, &camera, matchState, delta](EntityID entity, CameraFollowSettingsComponent &settings, CameraFollowRuntimeComponent &runtime) {
            (void)entity;
            if (!settings.enabled || settings.target == kNullEntity)
            {
                return;
            }

            auto *tComp = registry.GetComponent<TransformComponent>(settings.target);
            if (!tComp)
            {
                runtime.targetVisible = false;
                return;
            }

            runtime.targetVisible = true;
            glm::vec2 targetPos = tComp->Position + settings.offset;

            // Prediction calculations
            if (settings.mode == CameraFollowMode::PredictiveFollow && settings.lookAheadDistance > 0.0f)
            {
                targetPos.x += settings.lookAheadDistance;
            }

            // Apply Dead Zone
            glm::vec2 diff = targetPos - runtime.currentPosition;
            if (std::abs(diff.x) < settings.deadZone.x) targetPos.x = runtime.currentPosition.x;
            if (std::abs(diff.y) < settings.deadZone.y) targetPos.y = runtime.currentPosition.y;

            // Apply Scene View Constraints (minX, maxX, minY, maxY)
            targetPos.x = std::clamp(targetPos.x, settings.constraints.x, settings.constraints.y);
            targetPos.y = std::clamp(targetPos.y, settings.constraints.z, settings.constraints.w);

            runtime.desiredPosition = targetPos;

            // Ready state: Instant Snap
            if (matchState == MatchState::Ready || settings.mode == CameraFollowMode::InstantSnap)
            {
                runtime.currentPosition = targetPos;
                runtime.velocity = {0.0f, 0.0f};
            }
            else if (settings.mode == CameraFollowMode::Locked)
            {
                runtime.currentPosition = targetPos;
            }
            else
            {
                // Smooth Follow & Predictive Follow Interpolation
                float t = std::clamp(settings.followSpeed * delta, 0.0f, 1.0f);
                glm::vec2 prevPos = runtime.currentPosition;
                runtime.currentPosition = glm::mix(runtime.currentPosition, targetPos, t);
                runtime.velocity = (runtime.currentPosition - prevPos) / (delta > 0.0f ? delta : 1.0f);
            }

            camera.SetPosition(runtime.currentPosition);
        });
    }
}
