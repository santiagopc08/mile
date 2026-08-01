#include "engine/character/CharacterValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void CharacterValidationController::Initialize()
    {
        m_state = CharacterValidationState::SpawnCharacter;
        m_currentCharacter = kNullEntity;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[CharacterValidationController] Initialized autonomous character framework validation sequence.");
    }

    std::string CharacterValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case CharacterValidationState::SpawnCharacter: return "SpawnCharacter";
        case CharacterValidationState::EnableCharacter: return "EnableCharacter";
        case CharacterValidationState::DisableCharacter: return "DisableCharacter";
        case CharacterValidationState::ReEnableCharacter: return "ReEnableCharacter";
        case CharacterValidationState::DestroyCharacter: return "DestroyCharacter";
        case CharacterValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void CharacterValidationController::Update(Registry &registry, CharacterSystem &charSystem, double dt)
    {
        m_stateTimer += dt;

        switch (m_state)
        {
        case CharacterValidationState::SpawnCharacter:
            m_currentCharacter = charSystem.spawnCharacter(registry, 100, CharacterType::Player, {0.0f, 10.0f});
            m_state = CharacterValidationState::EnableCharacter;
            m_stateTimer = 0.0;
            LOG_INFO("[CharacterValidationController] Transitioned -> EnableCharacter");
            break;

        case CharacterValidationState::EnableCharacter:
            charSystem.enableCharacter(registry, m_currentCharacter);
            if (m_stateTimer >= 0.05)
            {
                m_state = CharacterValidationState::DisableCharacter;
                m_stateTimer = 0.0;
                LOG_INFO("[CharacterValidationController] Transitioned -> DisableCharacter");
            }
            break;

        case CharacterValidationState::DisableCharacter:
            charSystem.disableCharacter(registry, m_currentCharacter);
            if (m_stateTimer >= 0.05)
            {
                m_state = CharacterValidationState::ReEnableCharacter;
                m_stateTimer = 0.0;
                LOG_INFO("[CharacterValidationController] Transitioned -> ReEnableCharacter");
            }
            break;

        case CharacterValidationState::ReEnableCharacter:
            charSystem.enableCharacter(registry, m_currentCharacter);
            if (m_stateTimer >= 0.05)
            {
                m_state = CharacterValidationState::DestroyCharacter;
                m_stateTimer = 0.0;
                LOG_INFO("[CharacterValidationController] Transitioned -> DestroyCharacter");
            }
            break;

        case CharacterValidationState::DestroyCharacter:
            charSystem.destroyCharacter(registry, m_currentCharacter);
            m_currentCharacter = kNullEntity;
            m_cycleCount++;
            LOG_INFO("[CharacterValidationController] Completed full character validation cycle (Count: {}).", m_cycleCount);
            m_state = CharacterValidationState::Repeat;
            m_stateTimer = 0.0;
            break;

        case CharacterValidationState::Repeat:
            m_state = CharacterValidationState::SpawnCharacter;
            m_stateTimer = 0.0;
            break;
        }
    }
}
