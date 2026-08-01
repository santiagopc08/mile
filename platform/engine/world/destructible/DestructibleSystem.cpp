#include "engine/world/destructible/DestructibleSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void DestructibleSystem::damage(Registry &registry, EntityID destructibleEntity, uint32_t damagePoints)
    {
        auto *runtime = registry.GetComponent<DestructibleRuntimeComponent>(destructibleEntity);
        auto *settings = registry.GetComponent<DestructibleSettingsComponent>(destructibleEntity);

        if (!runtime) runtime = &registry.AddComponent<DestructibleRuntimeComponent>(destructibleEntity);
        if (!settings) settings = &registry.AddComponent<DestructibleSettingsComponent>(destructibleEntity);

        if (runtime->destroyed) return;

        if (runtime->currentHitPoints <= damagePoints)
        {
            destroy(registry, destructibleEntity);
        }
        else
        {
            runtime->currentHitPoints -= damagePoints;
            LOG_INFO("[DestructibleSystem] Entity #{} took {} damage (HP: {}).", destructibleEntity, damagePoints, runtime->currentHitPoints);
        }
    }

    void DestructibleSystem::repair(Registry &registry, EntityID destructibleEntity, uint32_t repairPoints)
    {
        auto *runtime = registry.GetComponent<DestructibleRuntimeComponent>(destructibleEntity);
        auto *settings = registry.GetComponent<DestructibleSettingsComponent>(destructibleEntity);

        if (runtime && settings)
        {
            runtime->destroyed = false;
            runtime->currentHitPoints = std::min(runtime->currentHitPoints + repairPoints, settings->hitPoints);
        }
    }

    void DestructibleSystem::destroy(Registry &registry, EntityID destructibleEntity)
    {
        auto *runtime = registry.GetComponent<DestructibleRuntimeComponent>(destructibleEntity);
        if (!runtime) runtime = &registry.AddComponent<DestructibleRuntimeComponent>(destructibleEntity);

        runtime->currentHitPoints = 0;
        runtime->destroyed = true;
        LOG_INFO("[DestructibleSystem] Destroyed object entity #{}.", destructibleEntity);
    }

    void DestructibleSystem::restore(Registry &registry, EntityID destructibleEntity)
    {
        auto *runtime = registry.GetComponent<DestructibleRuntimeComponent>(destructibleEntity);
        auto *settings = registry.GetComponent<DestructibleSettingsComponent>(destructibleEntity);

        if (!runtime) runtime = &registry.AddComponent<DestructibleRuntimeComponent>(destructibleEntity);
        if (!settings) settings = &registry.AddComponent<DestructibleSettingsComponent>(destructibleEntity);

        runtime->destroyed = false;
        runtime->currentHitPoints = settings->hitPoints;
        LOG_INFO("[DestructibleSystem] Restored object entity #{}.", destructibleEntity);
    }

    bool DestructibleSystem::isDestroyed(Registry &registry, EntityID destructibleEntity) const
    {
        auto *runtime = registry.GetComponent<DestructibleRuntimeComponent>(destructibleEntity);
        return runtime ? runtime->destroyed : false;
    }

    uint32_t DestructibleSystem::currentHitPoints(Registry &registry, EntityID destructibleEntity) const
    {
        auto *runtime = registry.GetComponent<DestructibleRuntimeComponent>(destructibleEntity);
        return runtime ? runtime->currentHitPoints : 0;
    }
}
