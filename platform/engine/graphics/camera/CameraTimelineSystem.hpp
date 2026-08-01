#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_SYSTEM_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_SYSTEM_HPP

#include "engine/graphics/camera/CameraTimelineSettingsComponent.hpp"
#include "engine/graphics/camera/CameraTimelineRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class CameraTimelineSystem : public IRuntimeProfiler
    {
    public:
        CameraTimelineSystem() = default;

        void playCameraTimeline(Registry &registry, EntityID camEntity);
        void pauseCameraTimeline(Registry &registry, EntityID camEntity);
        void seekCameraTimeline(Registry &registry, EntityID camEntity, double targetTime);
        void stopCameraTimeline(Registry &registry, EntityID camEntity);

        void Update(Registry &registry, double dt);

        [[nodiscard]] CameraTimelineState cameraTimelineState(Registry &registry, EntityID camEntity) const;
        [[nodiscard]] uint32_t currentTrack(Registry &registry, EntityID camEntity) const;
        [[nodiscard]] uint32_t currentKeyframe(Registry &registry, EntityID camEntity) const;
        [[nodiscard]] double remainingTime(Registry &registry, EntityID camEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_SYSTEM_HPP
