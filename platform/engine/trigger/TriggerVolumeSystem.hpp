#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_SYSTEM_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_SYSTEM_HPP

#include "engine/trigger/TriggerVolumeSettingsComponent.hpp"
#include "engine/trigger/TriggerVolumeRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class TriggerVolumeSystem
    {
    public:
        TriggerVolumeSystem() = default;

        EntityID createVolume(Registry &registry, uint32_t volumeID, VolumeShape shape, VolumeZoneType zoneType);
        void destroyVolume(Registry &registry, EntityID volumeEntity);
        void enableVolume(Registry &registry, EntityID volumeEntity);
        void disableVolume(Registry &registry, EntityID volumeEntity);

        void onEnter(Registry &registry, EntityID volumeEntity, EntityID occupant);
        void onExit(Registry &registry, EntityID volumeEntity, EntityID occupant);

        [[nodiscard]] bool isOccupied(Registry &registry, EntityID volumeEntity) const;
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_SYSTEM_HPP
