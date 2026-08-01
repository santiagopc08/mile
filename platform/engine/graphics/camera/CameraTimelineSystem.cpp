#include "engine/graphics/camera/CameraTimelineSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>
#include <cmath>

namespace platform
{
    void CameraTimelineSystem::playCameraTimeline(Registry &registry, EntityID camEntity)
    {
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        if (!runtime) runtime = &registry.AddComponent<CameraTimelineRuntimeComponent>(camEntity);

        runtime->state = CameraTimelineState::Playing;
        LOG_INFO("[CameraTimelineSystem] Started camera timeline on entity #{}.", camEntity);
    }

    void CameraTimelineSystem::pauseCameraTimeline(Registry &registry, EntityID camEntity)
    {
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        if (runtime && runtime->state == CameraTimelineState::Playing)
        {
            runtime->state = CameraTimelineState::Paused;
            LOG_INFO("[CameraTimelineSystem] Paused camera timeline on entity #{}.", camEntity);
        }
    }

    void CameraTimelineSystem::seekCameraTimeline(Registry &registry, EntityID camEntity, double targetTime)
    {
        auto *settings = registry.GetComponent<CameraTimelineSettingsComponent>(camEntity);
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);

        if (!settings || !runtime) return;

        runtime->currentTime = std::clamp(targetTime, 0.0, settings->duration);
        LOG_INFO("[CameraTimelineSystem] Seeked camera timeline on entity #{} to {:.2f}s.", camEntity, runtime->currentTime);
    }

    void CameraTimelineSystem::stopCameraTimeline(Registry &registry, EntityID camEntity)
    {
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        if (runtime)
        {
            runtime->state = CameraTimelineState::Inactive;
            runtime->currentTime = 0.0;
            runtime->currentKeyframe = 0;
            LOG_INFO("[CameraTimelineSystem] Stopped camera timeline on entity #{}.", camEntity);
        }
    }

    void CameraTimelineSystem::Update(Registry &registry, double dt)
    {
        auto view = registry.GetView<CameraTimelineSettingsComponent, CameraTimelineRuntimeComponent>();
        for (auto entity : view)
        {
            auto *settings = registry.GetComponent<CameraTimelineSettingsComponent>(entity);
            auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(entity);

            if (!settings || !runtime || runtime->state != CameraTimelineState::Playing) continue;

            runtime->currentTime += dt;

            if (settings->keyframes.empty()) continue;

            // Interpolate position & zoom between keyframes
            CameraKeyframe kfA = settings->keyframes[0];
            CameraKeyframe kfB = settings->keyframes[0];

            for (size_t i = 0; i < settings->keyframes.size(); ++i)
            {
                if (settings->keyframes[i].timestamp <= runtime->currentTime)
                {
                    kfA = settings->keyframes[i];
                    kfB = (i + 1 < settings->keyframes.size()) ? settings->keyframes[i + 1] : kfA;
                    runtime->currentKeyframe = static_cast<uint32_t>(i);
                }
            }

            float t = 0.0f;
            if (kfB.timestamp > kfA.timestamp)
            {
                t = static_cast<float>((runtime->currentTime - kfA.timestamp) / (kfB.timestamp - kfA.timestamp));
                t = std::clamp(t, 0.0f, 1.0f);
            }

            runtime->currentView.Transform = glm::mix(kfA.position, kfB.position, t);
            float zoom = glm::mix(kfA.zoom, kfB.zoom, t);
            if (zoom > 0.001f)
            {
                runtime->currentView.Viewport.z = 1280.0f / zoom;
                runtime->currentView.Viewport.w = 720.0f / zoom;
            }

            if (runtime->currentTime >= settings->duration)
            {
                if (settings->looping)
                {
                    runtime->currentTime = 0.0;
                    runtime->currentKeyframe = 0;
                }
                else
                {
                    runtime->state = CameraTimelineState::Completed;
                    LOG_INFO("[CameraTimelineSystem] Completed camera timeline execution on entity #{}.", entity);
                }
            }
        }
    }

    CameraTimelineState CameraTimelineSystem::cameraTimelineState(Registry &registry, EntityID camEntity) const
    {
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        return runtime ? runtime->state : CameraTimelineState::Inactive;
    }

    uint32_t CameraTimelineSystem::currentTrack(Registry &registry, EntityID camEntity) const
    {
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        return runtime ? runtime->currentTrack : 1;
    }

    uint32_t CameraTimelineSystem::currentKeyframe(Registry &registry, EntityID camEntity) const
    {
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        return runtime ? runtime->currentKeyframe : 0;
    }

    double CameraTimelineSystem::remainingTime(Registry &registry, EntityID camEntity) const
    {
        auto *settings = registry.GetComponent<CameraTimelineSettingsComponent>(camEntity);
        auto *runtime = registry.GetComponent<CameraTimelineRuntimeComponent>(camEntity);
        if (settings && runtime)
        {
            return std::max(0.0, settings->duration - runtime->currentTime);
        }
        return 0.0;
    }

    SubsystemProfilerMetrics CameraTimelineSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Driven";
        metrics.cpuTimeMs = 0.01;
        metrics.memoryUsageBytes = sizeof(CameraTimelineRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
