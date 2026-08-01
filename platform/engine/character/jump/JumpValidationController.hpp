#ifndef PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_VALIDATION_CONTROLLER_HPP

#include "engine/character/jump/JumpSystem.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class JumpValidationState
    {
        Walk,
        Jump,
        Land,
        Walk2,
        BufferedJump,
        Land2,
        CoyoteJump,
        Repeat
    };

    class JumpValidationController
    {
    public:
        JumpValidationController() = default;

        void Initialize();
        void Update(Registry &registry, CharacterSystem &charSystem, CharacterMovementSystem &moveSystem, JumpSystem &jumpSystem, double dt);

        [[nodiscard]] JumpValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        JumpValidationState m_state{JumpValidationState::Walk};
        EntityID m_character{kNullEntity};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_CHARACTER_JUMP_JUMP_VALIDATION_CONTROLLER_HPP
