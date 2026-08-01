#include "engine/animation/AnimationValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void AnimationValidationController::Initialize()
    {
        m_step = AnimValidationStep::Idle;
        m_character = kNullEntity;
        m_stepTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[AnimationValidationController] Initialized autonomous animation graph validation sequence.");
    }

    std::string AnimationValidationController::GetStateName() const
    {
        switch (m_step)
        {
        case AnimValidationStep::Idle: return "Idle";
        case AnimValidationStep::Walk: return "Walk";
        case AnimValidationStep::Run: return "Run";
        case AnimValidationStep::Jump: return "Jump";
        case AnimValidationStep::Fall: return "Fall";
        case AnimValidationStep::Land: return "Land";
        case AnimValidationStep::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void AnimationValidationController::Update(Registry &registry, CharacterSystem &charSystem, AnimationGraphSystem &animSystem, double dt)
    {
        m_stepTimer += dt;

        if (m_character == kNullEntity)
        {
            m_character = charSystem.spawnCharacter(registry, 1, CharacterType::Player, {0.0f, 0.0f});
            animSystem.play(registry, m_character);
        }

        switch (m_step)
        {
        case AnimValidationStep::Idle:
            animSystem.setParameter(registry, m_character, "Speed", 0.0f);
            animSystem.setParameter(registry, m_character, "Grounded", true);
            if (m_stepTimer >= 0.05)
            {
                m_step = AnimValidationStep::Walk;
                m_stepTimer = 0.0;
                LOG_INFO("[AnimationValidationController] Transitioned -> Walk");
            }
            break;

        case AnimValidationStep::Walk:
            animSystem.setParameter(registry, m_character, "Speed", 3.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = AnimValidationStep::Run;
                m_stepTimer = 0.0;
                LOG_INFO("[AnimationValidationController] Transitioned -> Run");
            }
            break;

        case AnimValidationStep::Run:
            animSystem.setParameter(registry, m_character, "Speed", 7.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = AnimValidationStep::Jump;
                m_stepTimer = 0.0;
                LOG_INFO("[AnimationValidationController] Transitioned -> Jump");
            }
            break;

        case AnimValidationStep::Jump:
            animSystem.setParameter(registry, m_character, "Grounded", false);
            animSystem.setParameter(registry, m_character, "VerticalSpeed", 5.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = AnimValidationStep::Fall;
                m_stepTimer = 0.0;
                LOG_INFO("[AnimationValidationController] Transitioned -> Fall");
            }
            break;

        case AnimValidationStep::Fall:
            animSystem.setParameter(registry, m_character, "VerticalSpeed", -5.0f);
            if (m_stepTimer >= 0.05)
            {
                m_step = AnimValidationStep::Land;
                m_stepTimer = 0.0;
                LOG_INFO("[AnimationValidationController] Transitioned -> Land");
            }
            break;

        case AnimValidationStep::Land:
            animSystem.setParameter(registry, m_character, "Grounded", true);
            animSystem.setParameter(registry, m_character, "VerticalSpeed", 0.0f);
            animSystem.setParameter(registry, m_character, "Speed", 0.0f);
            m_cycleCount++;
            LOG_INFO("[AnimationValidationController] Completed full animation graph validation cycle (Count: {}).", m_cycleCount);
            m_step = AnimValidationStep::Repeat;
            m_stepTimer = 0.0;
            break;

        case AnimValidationStep::Repeat:
            m_step = AnimValidationStep::Idle;
            m_stepTimer = 0.0;
            break;
        }
    }
}
