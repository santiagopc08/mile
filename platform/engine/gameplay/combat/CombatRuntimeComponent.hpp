#ifndef PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_RUNTIME_COMPONENT_HPP

namespace platform
{
    struct CombatRuntimeComponent
    {
        bool attacking{false};
        float cooldownRemaining{0.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_RUNTIME_COMPONENT_HPP
