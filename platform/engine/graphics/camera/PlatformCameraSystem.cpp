#include "engine/graphics/camera/PlatformCameraSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/character/movement/CharacterMovementRuntimeComponent.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void PlatformCameraSystem::setTarget(Registry &registry, EntityID cameraEntity, EntityID targetEntity)
    {
        m_targetEntity = targetEntity;

        auto *settings = registry.GetComponent<PlatformCameraSettingsComponent>(cameraEntity);
        if (!settings) registry.AddComponent<PlatformCameraSettingsComponent>(cameraEntity);

        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        if (!runtime) runtime = &registry.AddComponent<PlatformCameraRuntimeComponent>(cameraEntity);

        runtime->targetVisible = (targetEntity != kNullEntity);
        LOG_INFO("[PlatformCameraSystem] Camera #{} following target entity #{}.", cameraEntity, targetEntity);
    }

    void PlatformCameraSystem::clearTarget(Registry &registry, EntityID cameraEntity)
    {
        m_targetEntity = kNullEntity;
        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        if (runtime) runtime->targetVisible = false;
    }

    void PlatformCameraSystem::setMode(Registry &registry, EntityID cameraEntity, PlatformCameraMode mode)
    {
        auto *settings = registry.GetComponent<PlatformCameraSettingsComponent>(cameraEntity);
        if (!settings) registry.AddComponent<PlatformCameraSettingsComponent>(cameraEntity);

        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        if (!runtime) runtime = &registry.AddComponent<PlatformCameraRuntimeComponent>(cameraEntity);

        runtime->mode = mode;
    }

    void PlatformCameraSystem::setDeadZone(Registry &registry, EntityID cameraEntity, float width, float height)
    {
        auto *settings = registry.GetComponent<PlatformCameraSettingsComponent>(cameraEntity);
        if (!settings) settings = &registry.AddComponent<PlatformCameraSettingsComponent>(cameraEntity);
        settings->deadZoneWidth = width;
        settings->deadZoneHeight = height;
    }

    void PlatformCameraSystem::setLookAhead(Registry &registry, EntityID cameraEntity, const glm::vec2 &distance)
    {
        auto *settings = registry.GetComponent<PlatformCameraSettingsComponent>(cameraEntity);
        if (!settings) settings = &registry.AddComponent<PlatformCameraSettingsComponent>(cameraEntity);
        settings->lookAheadDistance = distance;
    }

    void PlatformCameraSystem::setWorldBounds(float minX, float maxX, float minY, float maxY)
    {
        m_minX = minX;
        m_maxX = maxX;
        m_minY = minY;
        m_maxY = maxY;
    }

    void PlatformCameraSystem::setZone(Registry &registry, EntityID cameraEntity, const std::string &zoneName)
    {
        auto *settings = registry.GetComponent<PlatformCameraSettingsComponent>(cameraEntity);
        if (!settings) settings = &registry.AddComponent<PlatformCameraSettingsComponent>(cameraEntity);

        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        if (!runtime) runtime = &registry.AddComponent<PlatformCameraRuntimeComponent>(cameraEntity);

        runtime->activeZone = zoneName;
    }

    void PlatformCameraSystem::Update(Registry &registry, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<PlatformCameraSettingsComponent, PlatformCameraRuntimeComponent>();

        view.Each([delta, &registry, this](EntityID entity, PlatformCameraSettingsComponent &settings, PlatformCameraRuntimeComponent &runtime) {
            glm::vec2 targetPos{0.0f, 0.0f};
            glm::vec2 targetVel{0.0f, 0.0f};

            if (m_targetEntity != kNullEntity)
            {
                auto *transform = registry.GetComponent<TransformComponent>(m_targetEntity);
                if (transform) targetPos = transform->Position;

                auto *moveRuntime = registry.GetComponent<CharacterMovementRuntimeComponent>(m_targetEntity);
                if (moveRuntime)
                {
                    targetVel.x = moveRuntime->currentSpeed;
                }
            }

            // Look-ahead prediction
            if (runtime.mode == PlatformCameraMode::PredictiveFollow)
            {
                if (targetVel.x > 0.1f) runtime.lookAhead.x = settings.lookAheadDistance.x;
                else if (targetVel.x < -0.1f) runtime.lookAhead.x = -settings.lookAheadDistance.x;
                else runtime.lookAhead.x *= 0.95f; // Smooth damp back
            }

            // Target desired position
            runtime.desiredPosition = targetPos + settings.followOffset + runtime.lookAhead;

            // Apply dead zone
            glm::vec2 diff = runtime.desiredPosition - runtime.smoothedPosition;
            if (std::abs(diff.x) < settings.deadZoneWidth * 0.5f) diff.x = 0.0f;
            if (std::abs(diff.y) < settings.deadZoneHeight * 0.5f) diff.y = 0.0f;

            // Interpolate / Smooth Follow
            if (runtime.mode == PlatformCameraMode::Immediate)
            {
                runtime.smoothedPosition = runtime.desiredPosition;
            }
            else
            {
                runtime.smoothedPosition += diff * settings.followSpeed * delta;
            }

            // Clamp World Bounds
            runtime.smoothedPosition.x = std::clamp(runtime.smoothedPosition.x, m_minX, m_maxX);
            runtime.smoothedPosition.y = std::clamp(runtime.smoothedPosition.y, m_minY, m_maxY);

            // Calculate camera velocity
            m_velocity = (runtime.smoothedPosition - m_lastPosition) / std::max(delta, 0.0001f);
            m_lastPosition = runtime.smoothedPosition;

            // Update transform
            auto *transform = registry.GetComponent<TransformComponent>(entity);
            if (transform)
            {
                transform->Position = runtime.smoothedPosition;
            }
        });
    }

    CameraView PlatformCameraSystem::generateCameraView(Registry &registry, EntityID cameraEntity) const
    {
        CameraView view{};
        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        view.Transform = runtime ? runtime->smoothedPosition : glm::vec2{0.0f, 0.0f};
        view.Viewport = glm::vec4{0.0f, 0.0f, 1280.0f, 720.0f};
        view.NearPlane = 0.1f;
        view.FarPlane = 1000.0f;
        return view;
    }

    PlatformCameraMode PlatformCameraSystem::cameraMode(Registry &registry, EntityID cameraEntity) const
    {
        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        return runtime ? runtime->mode : PlatformCameraMode::PredictiveFollow;
    }

    glm::vec2 PlatformCameraSystem::cameraVelocity(Registry &, EntityID) const
    {
        return m_velocity;
    }

    float PlatformCameraSystem::currentZoom(Registry &, EntityID) const
    {
        return 1.0f;
    }

    std::string PlatformCameraSystem::activeZone(Registry &registry, EntityID cameraEntity) const
    {
        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        return runtime ? runtime->activeZone : "";
    }

    glm::vec2 PlatformCameraSystem::targetPosition(Registry &registry, EntityID cameraEntity) const
    {
        auto *runtime = registry.GetComponent<PlatformCameraRuntimeComponent>(cameraEntity);
        return runtime ? runtime->desiredPosition : glm::vec2{0.0f, 0.0f};
    }

    SubsystemProfilerMetrics PlatformCameraSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = sizeof(PlatformCameraRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
