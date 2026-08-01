#ifndef PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_SYSTEM_HPP

#include "engine/gameplay/combat/CombatSettingsComponent.hpp"
#include "engine/gameplay/combat/CombatRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class CombatSystem
    {
    public:
        CombatSystem() = default;

        bool attack(Registry &registry, EntityID attacker, EntityID defender);
        void cancelAttack(Registry &registry, EntityID attacker);

        [[nodiscard]] bool canAttack(Registry &registry, EntityID attacker) const;
        [[nodiscard]] float cooldown(Registry &registry, EntityID attacker) const;

        void Update(Registry &registry, double dt);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_SYSTEM_HPP
