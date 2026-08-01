#ifndef PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_SYSTEM_HPP
#define PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_SYSTEM_HPP

#include "engine/world/destructible/DestructibleSettingsComponent.hpp"
#include "engine/world/destructible/DestructibleRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class DestructibleSystem
    {
    public:
        DestructibleSystem() = default;

        void damage(Registry &registry, EntityID destructibleEntity, uint32_t damagePoints = 1);
        void repair(Registry &registry, EntityID destructibleEntity, uint32_t repairPoints = 1);
        void destroy(Registry &registry, EntityID destructibleEntity);
        void restore(Registry &registry, EntityID destructibleEntity);

        [[nodiscard]] bool isDestroyed(Registry &registry, EntityID destructibleEntity) const;
        [[nodiscard]] uint32_t currentHitPoints(Registry &registry, EntityID destructibleEntity) const;
    };
}

#endif // PLATFORM_ENGINE_WORLD_DESTRUCTIBLE_DESTRUCTIBLE_SYSTEM_HPP
