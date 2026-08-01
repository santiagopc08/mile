#ifndef PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_VALIDATION_CONTROLLER_HPP

#include "engine/gameplay/enemy/EnemySystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class EnemyValidationStep
    {
        Spawn,
        Enable,
        AssignTarget,
        ClearTarget,
        Disable,
        Destroy,
        Repeat
    };

    class EnemyValidationController
    {
    public:
        EnemyValidationController() = default;

        void Initialize();
        void Update(Registry &registry, EnemySystem &enemySystem, double dt);

        [[nodiscard]] EnemyValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        EnemyValidationStep m_step{EnemyValidationStep::Spawn};
        EntityID m_enemy{kNullEntity};
        EntityID m_player{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_VALIDATION_CONTROLLER_HPP
