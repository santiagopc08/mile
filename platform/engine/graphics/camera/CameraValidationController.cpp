#include "engine/graphics/camera/CameraValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void CameraValidationController::Initialize()
    {
        m_state = CameraValidationSequenceState::SpawnVehicle;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[CameraValidationController] Initialized autonomous camera validation sequence.");
    }

    std::string CameraValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case CameraValidationSequenceState::SpawnVehicle: return "SpawnVehicle";
        case CameraValidationSequenceState::MoveForward: return "MoveForward";
        case CameraValidationSequenceState::MoveBackward: return "MoveBackward";
        case CameraValidationSequenceState::Jump: return "Jump";
        case CameraValidationSequenceState::Stop: return "Stop";
        case CameraValidationSequenceState::Pause: return "Pause";
        case CameraValidationSequenceState::Resume: return "Resume";
        case CameraValidationSequenceState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void CameraValidationController::Update(GameplayStateMachine &stateMachine, VehicleControllerRuntimeComponent &cRuntime, VehicleControllerSystem &vcSystem, double dt)
    {
        m_stateTimer += dt;

        switch (m_state)
        {
        case CameraValidationSequenceState::SpawnVehicle:
            stateMachine.TransitionTo(MatchState::Ready);
            if (m_stateTimer >= 0.1)
            {
                stateMachine.TransitionTo(MatchState::Playing);
                m_state = CameraValidationSequenceState::MoveForward;
                m_stateTimer = 0.0;
                LOG_INFO("[CameraValidationController] Transitioned -> MoveForward");
            }
            break;

        case CameraValidationSequenceState::MoveForward:
            vcSystem.setThrottle(cRuntime, 1.0f);
            vcSystem.setReverse(cRuntime, false);
            if (m_stateTimer >= 0.3)
            {
                m_state = CameraValidationSequenceState::MoveBackward;
                m_stateTimer = 0.0;
                LOG_INFO("[CameraValidationController] Transitioned -> MoveBackward");
            }
            break;

        case CameraValidationSequenceState::MoveBackward:
            vcSystem.setThrottle(cRuntime, 1.0f);
            vcSystem.setReverse(cRuntime, true);
            if (m_stateTimer >= 0.3)
            {
                m_state = CameraValidationSequenceState::Jump;
                m_stateTimer = 0.0;
                LOG_INFO("[CameraValidationController] Transitioned -> Jump");
            }
            break;

        case CameraValidationSequenceState::Jump:
            vcSystem.setThrottle(cRuntime, 0.5f);
            if (m_stateTimer >= 0.2)
            {
                m_state = CameraValidationSequenceState::Stop;
                m_stateTimer = 0.0;
                LOG_INFO("[CameraValidationController] Transitioned -> Stop");
            }
            break;

        case CameraValidationSequenceState::Stop:
            vcSystem.reset(cRuntime);
            if (m_stateTimer >= 0.1)
            {
                m_state = CameraValidationSequenceState::Pause;
                m_stateTimer = 0.0;
                LOG_INFO("[CameraValidationController] Transitioned -> Pause");
            }
            break;

        case CameraValidationSequenceState::Pause:
            stateMachine.TransitionTo(MatchState::Paused);
            if (m_stateTimer >= 0.2)
            {
                m_state = CameraValidationSequenceState::Resume;
                m_stateTimer = 0.0;
                LOG_INFO("[CameraValidationController] Transitioned -> Resume");
            }
            break;

        case CameraValidationSequenceState::Resume:
            stateMachine.TransitionTo(MatchState::Playing);
            if (m_stateTimer >= 0.1)
            {
                m_state = CameraValidationSequenceState::Repeat;
                m_stateTimer = 0.0;
                m_cycleCount++;
                LOG_INFO("[CameraValidationController] Completed full camera validation cycle (Count: {}).", m_cycleCount);
            }
            break;

        case CameraValidationSequenceState::Repeat:
            m_state = CameraValidationSequenceState::MoveForward;
            m_stateTimer = 0.0;
            break;
        }
    }
}
