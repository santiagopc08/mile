#include "engine/trigger/TriggerVolumeSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EntityID TriggerVolumeSystem::createVolume(Registry &registry, uint32_t volumeID, VolumeShape shape, VolumeZoneType zoneType)
    {
        EntityID volume = registry.CreateEntity("TriggerVolume");
        auto &settings = registry.AddComponent<TriggerVolumeSettingsComponent>(volume);
        registry.AddComponent<TriggerVolumeRuntimeComponent>(volume);

        settings.volumeID = volumeID;
        settings.shape = shape;
        settings.zoneType = zoneType;
        settings.enabled = true;

        LOG_INFO("[TriggerVolumeSystem] Created volume ID {} on entity #{}.", volumeID, volume);
        return volume;
    }

    void TriggerVolumeSystem::destroyVolume(Registry &registry, EntityID volumeEntity)
    {
        registry.DestroyEntity(volumeEntity);
        LOG_INFO("[TriggerVolumeSystem] Destroyed volume entity #{}.", volumeEntity);
    }

    void TriggerVolumeSystem::enableVolume(Registry &registry, EntityID volumeEntity)
    {
        auto *settings = registry.GetComponent<TriggerVolumeSettingsComponent>(volumeEntity);
        if (settings) settings->enabled = true;
    }

    void TriggerVolumeSystem::disableVolume(Registry &registry, EntityID volumeEntity)
    {
        auto *settings = registry.GetComponent<TriggerVolumeSettingsComponent>(volumeEntity);
        if (settings) settings->enabled = false;
    }

    void TriggerVolumeSystem::onEnter(Registry &registry, EntityID volumeEntity, EntityID occupant)
    {
        auto *settings = registry.GetComponent<TriggerVolumeSettingsComponent>(volumeEntity);
        auto *runtime = registry.GetComponent<TriggerVolumeRuntimeComponent>(volumeEntity);

        if (!settings || !runtime || !settings->enabled) return;

        runtime->occupants.insert(occupant);
        runtime->occupied = true;
        LOG_INFO("[TriggerVolumeSystem] Occupant #{} entered volume entity #{}.", occupant, volumeEntity);
    }

    void TriggerVolumeSystem::onExit(Registry &registry, EntityID volumeEntity, EntityID occupant)
    {
        auto *runtime = registry.GetComponent<TriggerVolumeRuntimeComponent>(volumeEntity);

        if (!runtime) return;

        runtime->occupants.erase(occupant);
        runtime->occupied = !runtime->occupants.empty();
        LOG_INFO("[TriggerVolumeSystem] Occupant #{} exited volume entity #{}.", occupant, volumeEntity);
    }

    bool TriggerVolumeSystem::isOccupied(Registry &registry, EntityID volumeEntity) const
    {
        auto *runtime = registry.GetComponent<TriggerVolumeRuntimeComponent>(volumeEntity);
        return runtime ? runtime->occupied : false;
    }
}
