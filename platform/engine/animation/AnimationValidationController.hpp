#ifndef PLATFORM_ENGINE_ANIMATION_ANIMATION_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_ANIMATION_ANIMATION_VALIDATION_CONTROLLER_HPP

#include "engine/animation/AnimationGraphSystem.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class AnimValidationStep
    {
        Idle,
        Walk,
        Run,
        Jump,
        Fall,
        Land,
        Repeat
    };

    class AnimationValidationController
    {
    public:
        AnimationValidationController() = default;

        void Initialize();
        void Update(Registry &registry, CharacterSystem &charSystem, AnimationGraphSystem &animSystem, double dt);

        [[nodiscard]] AnimValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        AnimValidationStep m_step{AnimValidationStep::Idle};
        EntityID m_character{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_ANIMATION_ANIMATION_VALIDATION_CONTROLLER_HPP
