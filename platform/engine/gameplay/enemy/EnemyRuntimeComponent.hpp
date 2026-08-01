#ifndef PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_RUNTIME_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    enum class EnemyState
    {
        Spawn,
        Idle,
        Patrol,
        Alert,
        Attack,
        Hit,
        Dead,
        Disabled
    };

    struct EnemyRuntimeComponent
    {
        EnemyState state{EnemyState::Spawn};
        EntityID currentTarget{kNullEntity};
        bool active{true};
        bool alive{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_RUNTIME_COMPONENT_HPP
