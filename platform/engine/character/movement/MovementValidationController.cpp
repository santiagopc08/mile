#include "engine/character/movement/MovementValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void MovementValidationController::Initialize()
    {
        m_state = MovementValidationState::Spawn;
        m_character = kNullEntity;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[MovementValidationController] Initialized autonomous movement validation sequence.");
    }

    std::string MovementValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case MovementValidationState::Spawn: return "Spawn";
        case MovementValidationState::WalkRight: return "WalkRight";
        case MovementValidationState::StopWalk: return "StopWalk";
        case MovementValidationState::WalkLeft: return "WalkLeft";
        case MovementValidationState::RunRight: return "RunRight";
        case MovementValidationState::StopRun: return "StopRun";
        case MovementValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void MovementValidationController::Update(Registry &registry, CharacterSystem &charSystem, CharacterMovementSystem &moveSystem, double dt)
    {
        m_stateTimer += dt;

        switch (m_state)
        {
        case MovementValidationState::Spawn:
            m_character = charSystem.spawnCharacter(registry, 1, CharacterType::Player, {0.0f, 0.0f});
            m_state = MovementValidationState::WalkRight;
            m_stateTimer = 0.0;
            LOG_INFO("[MovementValidationController] Transitioned -> WalkRight");
            break;

        case MovementValidationState::WalkRight:
            moveSystem.moveRight(registry, m_character, 1.0f);
            if (m_stateTimer >= 0.1)
            {
                m_state = MovementValidationState::StopWalk;
                m_stateTimer = 0.0;
                LOG_INFO("[MovementValidationController] Transitioned -> StopWalk");
            }
            break;

        case MovementValidationState::StopWalk:
            moveSystem.stop(registry, m_character);
            if (m_stateTimer >= 0.1)
            {
                m_state = MovementValidationState::WalkLeft;
                m_stateTimer = 0.0;
                LOG_INFO("[MovementValidationController] Transitioned -> WalkLeft");
            }
            break;

        case MovementValidationState::WalkLeft:
            moveSystem.moveLeft(registry, m_character, 1.0f);
            if (m_stateTimer >= 0.1)
            {
                m_state = MovementValidationState::RunRight;
                m_stateTimer = 0.0;
                LOG_INFO("[MovementValidationController] Transitioned -> RunRight");
            }
            break;

        case MovementValidationState::RunRight:
            moveSystem.enableRunning(registry, m_character, true);
            moveSystem.moveRight(registry, m_character, 1.0f);
            if (m_stateTimer >= 0.1)
            {
                m_state = MovementValidationState::StopRun;
                m_stateTimer = 0.0;
                LOG_INFO("[MovementValidationController] Transitioned -> StopRun");
            }
            break;

        case MovementValidationState::StopRun:
            moveSystem.stop(registry, m_character);
            moveSystem.enableRunning(registry, m_character, false);
            m_cycleCount++;
            LOG_INFO("[MovementValidationController] Completed full movement validation cycle (Count: {}).", m_cycleCount);
            m_state = MovementValidationState::Repeat;
            m_stateTimer = 0.0;
            break;

        case MovementValidationState::Repeat:
            m_state = MovementValidationState::WalkRight;
            m_stateTimer = 0.0;
            break;
        }
    }
}
