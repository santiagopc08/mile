#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_VALIDATION_CONTROLLER_HPP

#include "engine/graphics/camera/PlatformCameraSystem.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class PlatformCamValidationStep
    {
        Walk,
        Run,
        Jump,
        Fall,
        Stop,
        Reverse,
        Repeat
    };

    class PlatformCameraValidationController
    {
    public:
        PlatformCameraValidationController() = default;

        void Initialize();
        void Update(Registry &registry, CharacterSystem &charSystem, CharacterMovementSystem &moveSystem, PlatformCameraSystem &camSystem, double dt);

        [[nodiscard]] PlatformCamValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        PlatformCamValidationStep m_step{PlatformCamValidationStep::Walk};
        EntityID m_character{kNullEntity};
        EntityID m_camera{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_PLATFORM_CAMERA_VALIDATION_CONTROLLER_HPP
