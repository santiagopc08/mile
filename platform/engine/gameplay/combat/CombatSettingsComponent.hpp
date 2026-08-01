#ifndef PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_SETTINGS_COMPONENT_HPP

namespace platform
{
    enum class AttackType
    {
        Melee,
        Projectile,
        Area,
        Contact
    };

    struct CombatSettingsComponent
    {
        float damage{10.0f};
        float cooldown{0.5f};
        AttackType type{AttackType::Melee};
        float range{1.5f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COMBAT_COMBAT_SETTINGS_COMPONENT_HPP
