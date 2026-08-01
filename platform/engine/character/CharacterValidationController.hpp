#ifndef PLATFORM_ENGINE_CHARACTER_CHARACTER_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_CHARACTER_CHARACTER_VALIDATION_CONTROLLER_HPP

#include "engine/character/CharacterSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class CharacterValidationState
    {
        SpawnCharacter,
        EnableCharacter,
        DisableCharacter,
        ReEnableCharacter,
        DestroyCharacter,
        Repeat
    };

    class CharacterValidationController
    {
    public:
        CharacterValidationController() = default;

        void Initialize();
        void Update(Registry &registry, CharacterSystem &charSystem, double dt);

        [[nodiscard]] CharacterValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        CharacterValidationState m_state{CharacterValidationState::SpawnCharacter};
        EntityID m_currentCharacter{kNullEntity};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_CHARACTER_VALIDATION_CONTROLLER_HPP
