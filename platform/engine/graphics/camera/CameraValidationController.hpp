#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_VALIDATION_CONTROLLER_HPP

#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/vehicle/components/VehicleControllerRuntimeComponent.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"
#include <string>

namespace platform
{
    enum class CameraValidationSequenceState
    {
        SpawnVehicle,
        MoveForward,
        MoveBackward,
        Jump,
        Stop,
        Pause,
        Resume,
        Repeat
    };

    class CameraValidationController
    {
    public:
        CameraValidationController() = default;

        void Initialize();
        void Update(GameplayStateMachine &stateMachine, VehicleControllerRuntimeComponent &cRuntime, VehicleControllerSystem &vcSystem, double dt);

        [[nodiscard]] CameraValidationSequenceState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        CameraValidationSequenceState m_state{CameraValidationSequenceState::SpawnVehicle};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_VALIDATION_CONTROLLER_HPP
