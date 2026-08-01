#ifndef PLATFORM_ENGINE_VEHICLE_CONTROLLERS_VEHICLE_CONTROLLER_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_VEHICLE_CONTROLLERS_VEHICLE_CONTROLLER_VALIDATION_CONTROLLER_HPP

#include "engine/vehicle/components/VehicleControllerRuntimeComponent.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"
#include <string>

namespace platform
{
    enum class AutonomousValidationState
    {
        Idle,
        Accelerate,
        Cruise,
        Brake,
        Stop,
        Reverse,
        Repeat
    };

    class VehicleControllerValidationController
    {
    public:
        VehicleControllerValidationController() = default;

        void Initialize();
        void Update(VehicleControllerRuntimeComponent &runtime, VehicleControllerSystem &controllerSystem, double dt);

        [[nodiscard]] AutonomousValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        AutonomousValidationState m_state{AutonomousValidationState::Idle};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_CONTROLLERS_VEHICLE_CONTROLLER_VALIDATION_CONTROLLER_HPP
