#ifndef PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_SETTINGS_COMPONENT_HPP

namespace platform
{
    enum class EnemyType
    {
        Walking,
        Flying,
        Patrol,
        Stationary,
        Boss
    };

    enum class Faction
    {
        Hostile,
        Neutral,
        Friendly
    };

    struct EnemySettingsComponent
    {
        EnemyType type{EnemyType::Walking};
        Faction faction{Faction::Hostile};
        float detectionRadius{10.0f};
        float attackRadius{2.0f};
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_SETTINGS_COMPONENT_HPP
