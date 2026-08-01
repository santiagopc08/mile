#include "engine/gameplay/hazards/HazardSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void HazardSystem::activate(Registry &registry, EntityID hazardEntity)
    {
        auto *runtime = registry.GetComponent<HazardRuntimeComponent>(hazardEntity);
        if (!runtime) runtime = &registry.AddComponent<HazardRuntimeComponent>(hazardEntity);

        runtime->active = true;
        LOG_INFO("[HazardSystem] Activated hazard entity #{}.", hazardEntity);
    }

    void HazardSystem::deactivate(Registry &registry, EntityID hazardEntity)
    {
        auto *runtime = registry.GetComponent<HazardRuntimeComponent>(hazardEntity);
        if (runtime) runtime->active = false;
    }

    void HazardSystem::damage(Registry &registry, EntityID hazardEntity, EntityID victimEntity)
    {
        auto *settings = registry.GetComponent<HazardSettingsComponent>(hazardEntity);
        auto *runtime = registry.GetComponent<HazardRuntimeComponent>(hazardEntity);

        if (!settings || !runtime || !runtime->active) return;

        LOG_INFO("[HazardSystem] Hazard #{} damaged victim #{} for {:.1f} damage.",
                 hazardEntity, victimEntity, settings->damageAmount);
    }

    void HazardSystem::kill(Registry &registry, EntityID hazardEntity, EntityID victimEntity)
    {
        auto *runtime = registry.GetComponent<HazardRuntimeComponent>(hazardEntity);

        if (!runtime || !runtime->active) return;

        LOG_INFO("[HazardSystem] Hazard #{} INSTANT KILLED victim #{}.", hazardEntity, victimEntity);
    }

    bool HazardSystem::isActive(Registry &registry, EntityID hazardEntity) const
    {
        auto *runtime = registry.GetComponent<HazardRuntimeComponent>(hazardEntity);
        return runtime ? runtime->active : true;
    }
}
