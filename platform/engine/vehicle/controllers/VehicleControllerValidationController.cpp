#include "engine/vehicle/controllers/VehicleControllerValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void VehicleControllerValidationController::Initialize()
    {
        m_state = AutonomousValidationState::Idle;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[AutonomousValidationController] Initialized autonomous validation sequence.");
    }

    std::string VehicleControllerValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case AutonomousValidationState::Idle: return "Idle";
        case AutonomousValidationState::Accelerate: return "Accelerate";
        case AutonomousValidationState::Cruise: return "Cruise";
        case AutonomousValidationState::Brake: return "Brake";
        case AutonomousValidationState::Stop: return "Stop";
        case AutonomousValidationState::Reverse: return "Reverse";
        case AutonomousValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void VehicleControllerValidationController::Update(VehicleControllerRuntimeComponent &runtime, VehicleControllerSystem &controllerSystem, double dt)
    {
        m_stateTimer += dt;

        switch (m_state)
        {
        case AutonomousValidationState::Idle:
            controllerSystem.reset(runtime);
            if (m_stateTimer >= 0.1)
            {
                m_state = AutonomousValidationState::Accelerate;
                m_stateTimer = 0.0;
                LOG_INFO("[AutonomousValidationController] Transitioned -> Accelerate");
            }
            break;

        case AutonomousValidationState::Accelerate:
            controllerSystem.setThrottle(runtime, 1.0f);
            controllerSystem.setReverse(runtime, false);
            if (m_stateTimer >= 0.3)
            {
                m_state = AutonomousValidationState::Cruise;
                m_stateTimer = 0.0;
                LOG_INFO("[AutonomousValidationController] Transitioned -> Cruise");
            }
            break;

        case AutonomousValidationState::Cruise:
            controllerSystem.setThrottle(runtime, 0.6f);
            if (m_stateTimer >= 0.2)
            {
                m_state = AutonomousValidationState::Brake;
                m_stateTimer = 0.0;
                LOG_INFO("[AutonomousValidationController] Transitioned -> Brake");
            }
            break;

        case AutonomousValidationState::Brake:
            controllerSystem.setThrottle(runtime, 0.0f);
            controllerSystem.applyBrake(runtime);
            if (m_stateTimer >= 0.2)
            {
                m_state = AutonomousValidationState::Stop;
                m_stateTimer = 0.0;
                LOG_INFO("[AutonomousValidationController] Transitioned -> Stop");
            }
            break;

        case AutonomousValidationState::Stop:
            controllerSystem.releaseBrake(runtime);
            controllerSystem.setThrottle(runtime, 0.0f);
            if (m_stateTimer >= 0.1)
            {
                m_state = AutonomousValidationState::Reverse;
                m_stateTimer = 0.0;
                LOG_INFO("[AutonomousValidationController] Transitioned -> Reverse");
            }
            break;

        case AutonomousValidationState::Reverse:
            controllerSystem.setReverse(runtime, true);
            controllerSystem.setThrottle(runtime, 0.8f);
            if (m_stateTimer >= 0.3)
            {
                m_state = AutonomousValidationState::Repeat;
                m_stateTimer = 0.0;
                m_cycleCount++;
                LOG_INFO("[AutonomousValidationController] Completed full validation cycle (Count: {}).", m_cycleCount);
            }
            break;

        case AutonomousValidationState::Repeat:
            controllerSystem.reset(runtime);
            m_state = AutonomousValidationState::Accelerate;
            m_stateTimer = 0.0;
            break;
        }
    }
}
