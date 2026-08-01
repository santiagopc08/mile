#ifndef PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    using EnemyID = uint32_t;

    enum class EnemyArchetype
    {
        Standard,
        Elite,
        Boss
    };

    struct EnemyComponent
    {
        EnemyID id{0};
        EnemyArchetype archetype{EnemyArchetype::Standard};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_ENEMY_ENEMY_COMPONENT_HPP
