#ifndef PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_SYSTEM_HPP

#include "engine/gameplay/health/HealthSettingsComponent.hpp"
#include "engine/gameplay/health/HealthRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class HealthSystem
    {
    public:
        HealthSystem() = default;

        void damage(Registry &registry, EntityID entity, float damagePoints);
        void heal(Registry &registry, EntityID entity, float healPoints);
        void kill(Registry &registry, EntityID entity);
        void revive(Registry &registry, EntityID entity);

        [[nodiscard]] bool isDead(Registry &registry, EntityID entity) const;
        [[nodiscard]] float currentHealth(Registry &registry, EntityID entity) const;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_SYSTEM_HPP
