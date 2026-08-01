#ifndef PLATFORM_ENGINE_CHARACTER_MOVEMENT_MOVEMENT_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_CHARACTER_MOVEMENT_MOVEMENT_VALIDATION_CONTROLLER_HPP

#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class MovementValidationState
    {
        Spawn,
        WalkRight,
        StopWalk,
        WalkLeft,
        RunRight,
        StopRun,
        Repeat
    };

    class MovementValidationController
    {
    public:
        MovementValidationController() = default;

        void Initialize();
        void Update(Registry &registry, CharacterSystem &charSystem, CharacterMovementSystem &moveSystem, double dt);

        [[nodiscard]] MovementValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        MovementValidationState m_state{MovementValidationState::Spawn};
        EntityID m_character{kNullEntity};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_MOVEMENT_MOVEMENT_VALIDATION_CONTROLLER_HPP
