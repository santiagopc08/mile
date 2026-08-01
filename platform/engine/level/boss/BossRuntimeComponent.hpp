#ifndef PLATFORM_ENGINE_LEVEL_BOSS_BOSS_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_BOSS_BOSS_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct BossRuntimeComponent
    {
        uint32_t currentPhase{1};
        bool active{false};
        bool enraged{false};
        bool defeated{false};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_BOSS_BOSS_RUNTIME_COMPONENT_HPP
