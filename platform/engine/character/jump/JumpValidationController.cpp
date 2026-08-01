#include "engine/character/jump/JumpValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void JumpValidationController::Initialize()
    {
        m_state = JumpValidationState::Walk;
        m_character = kNullEntity;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[JumpValidationController] Initialized autonomous jump validation sequence.");
    }

    std::string JumpValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case JumpValidationState::Walk: return "Walk";
        case JumpValidationState::Jump: return "Jump";
        case JumpValidationState::Land: return "Land";
        case JumpValidationState::Walk2: return "Walk2";
        case JumpValidationState::BufferedJump: return "BufferedJump";
        case JumpValidationState::Land2: return "Land2";
        case JumpValidationState::CoyoteJump: return "CoyoteJump";
        case JumpValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void JumpValidationController::Update(Registry &registry, CharacterSystem &charSystem, CharacterMovementSystem &moveSystem, JumpSystem &jumpSystem, double dt)
    {
        m_stateTimer += dt;

        if (m_character == kNullEntity)
        {
            m_character = charSystem.spawnCharacter(registry, 1, CharacterType::Player, {0.0f, 0.0f});
        }

        switch (m_state)
        {
        case JumpValidationState::Walk:
            moveSystem.moveRight(registry, m_character, 1.0f);
            if (m_stateTimer >= 0.05)
            {
                m_state = JumpValidationState::Jump;
                m_stateTimer = 0.0;
                LOG_INFO("[JumpValidationController] Transitioned -> Jump");
            }
            break;

        case JumpValidationState::Jump:
            jumpSystem.requestJump(registry, m_character);
            m_state = JumpValidationState::Land;
            m_stateTimer = 0.0;
            LOG_INFO("[JumpValidationController] Transitioned -> Land");
            break;

        case JumpValidationState::Land:
            if (m_stateTimer >= 0.05)
            {
                m_state = JumpValidationState::Walk2;
                m_stateTimer = 0.0;
                LOG_INFO("[JumpValidationController] Transitioned -> Walk2");
            }
            break;

        case JumpValidationState::Walk2:
            moveSystem.moveRight(registry, m_character, 1.0f);
            if (m_stateTimer >= 0.05)
            {
                m_state = JumpValidationState::BufferedJump;
                m_stateTimer = 0.0;
                LOG_INFO("[JumpValidationController] Transitioned -> BufferedJump");
            }
            break;

        case JumpValidationState::BufferedJump:
            jumpSystem.requestJump(registry, m_character);
            m_state = JumpValidationState::Land2;
            m_stateTimer = 0.0;
            LOG_INFO("[JumpValidationController] Transitioned -> Land2");
            break;

        case JumpValidationState::Land2:
            if (m_stateTimer >= 0.05)
            {
                m_state = JumpValidationState::CoyoteJump;
                m_stateTimer = 0.0;
                LOG_INFO("[JumpValidationController] Transitioned -> CoyoteJump");
            }
            break;

        case JumpValidationState::CoyoteJump:
            jumpSystem.requestJump(registry, m_character);
            m_cycleCount++;
            LOG_INFO("[JumpValidationController] Completed full jump validation cycle (Count: {}).", m_cycleCount);
            m_state = JumpValidationState::Repeat;
            m_stateTimer = 0.0;
            break;

        case JumpValidationState::Repeat:
            m_state = JumpValidationState::Walk;
            m_stateTimer = 0.0;
            break;
        }
    }
}
