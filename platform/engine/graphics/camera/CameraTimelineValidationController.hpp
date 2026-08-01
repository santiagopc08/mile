#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_VALIDATION_CONTROLLER_HPP

#include "engine/graphics/camera/CameraTimelineSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class CameraTimelineValidationStep
    {
        MoveCamera,
        Zoom,
        Shake,
        FollowCharacter,
        Restore,
        Repeat
    };

    class CameraTimelineValidationController
    {
    public:
        CameraTimelineValidationController() = default;

        void Initialize();
        void Update(Registry &registry, CameraTimelineSystem &camSystem, double dt);

        [[nodiscard]] CameraTimelineValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        CameraTimelineValidationStep m_step{CameraTimelineValidationStep::MoveCamera};
        EntityID m_camEntity{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_VALIDATION_CONTROLLER_HPP
