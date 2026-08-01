#include "engine/level/portal/PortalSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void PortalSystem::activatePortal(Registry &registry, EntityID portalEntity)
    {
        auto *runtime = registry.GetComponent<PortalRuntimeComponent>(portalEntity);
        if (!runtime) runtime = &registry.AddComponent<PortalRuntimeComponent>(portalEntity);
        runtime->active = true;
    }

    void PortalSystem::deactivatePortal(Registry &registry, EntityID portalEntity)
    {
        auto *runtime = registry.GetComponent<PortalRuntimeComponent>(portalEntity);
        if (runtime) runtime->active = false;
    }

    bool PortalSystem::travel(Registry &registry, EntityID portalEntity, EntityID travelerEntity)
    {
        auto *settings = registry.GetComponent<PortalSettingsComponent>(portalEntity);
        auto *runtime = registry.GetComponent<PortalRuntimeComponent>(portalEntity);

        if (!settings) settings = &registry.AddComponent<PortalSettingsComponent>(portalEntity);
        if (!runtime) runtime = &registry.AddComponent<PortalRuntimeComponent>(portalEntity);

        if (!runtime->active) return false;

        runtime->occupied = true;
        runtime->traveler = travelerEntity;
        LOG_INFO("[PortalSystem] Traveler entity #{} entered portal entity #{}. Transporting to Level ID {}.",
                 travelerEntity, portalEntity, settings->destinationLevel);
        return true;
    }

    void PortalSystem::cancelTravel(Registry &registry, EntityID portalEntity)
    {
        auto *runtime = registry.GetComponent<PortalRuntimeComponent>(portalEntity);
        if (runtime)
        {
            runtime->occupied = false;
            runtime->traveler = kNullEntity;
        }
    }

    bool PortalSystem::isActive(Registry &registry, EntityID portalEntity) const
    {
        auto *runtime = registry.GetComponent<PortalRuntimeComponent>(portalEntity);
        return runtime ? runtime->active : true;
    }

    bool PortalSystem::isOccupied(Registry &registry, EntityID portalEntity) const
    {
        auto *runtime = registry.GetComponent<PortalRuntimeComponent>(portalEntity);
        return runtime ? runtime->occupied : false;
    }

    LevelID PortalSystem::destinationLevel(Registry &registry, EntityID portalEntity) const
    {
        auto *settings = registry.GetComponent<PortalSettingsComponent>(portalEntity);
        return settings ? settings->destinationLevel : 1;
    }
}
