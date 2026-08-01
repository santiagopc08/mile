#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_SYSTEM_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_SYSTEM_HPP

#include "engine/graphics/camera/PlatformCameraSettingsComponent.hpp"
#include "engine/graphics/camera/PlatformCameraRuntimeComponent.hpp"
#include "engine/graphics/camera/CameraView.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <glm/glm.hpp>
#include <string>

namespace platform
{
    class PlatformCameraSystem : public IRuntimeProfiler
    {
    public:
        PlatformCameraSystem() = default;

        void setTarget(Registry &registry, EntityID cameraEntity, EntityID targetEntity);
        void clearTarget(Registry &registry, EntityID cameraEntity);
        void setMode(Registry &registry, EntityID cameraEntity, PlatformCameraMode mode);
        void setDeadZone(Registry &registry, EntityID cameraEntity, float width, float height);
        void setLookAhead(Registry &registry, EntityID cameraEntity, const glm::vec2 &distance);
        void setWorldBounds(float minX, float maxX, float minY, float maxY);
        void setZone(Registry &registry, EntityID cameraEntity, const std::string &zoneName);

        void Update(Registry &registry, double dt);

        [[nodiscard]] CameraView generateCameraView(Registry &registry, EntityID cameraEntity) const;

        [[nodiscard]] PlatformCameraMode cameraMode(Registry &registry, EntityID cameraEntity) const;
        [[nodiscard]] glm::vec2 cameraVelocity(Registry &registry, EntityID cameraEntity) const;
        [[nodiscard]] float currentZoom(Registry &registry, EntityID cameraEntity) const;
        [[nodiscard]] std::string activeZone(Registry &registry, EntityID cameraEntity) const;
        [[nodiscard]] glm::vec2 targetPosition(Registry &registry, EntityID cameraEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;

    private:
        EntityID m_targetEntity{kNullEntity};
        float m_minX{-1000.0f};
        float m_maxX{10000.0f};
        float m_minY{-500.0f};
        float m_maxY{500.0f};
        glm::vec2 m_lastPosition{0.0f, 0.0f};
        glm::vec2 m_velocity{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_SYSTEM_HPP
