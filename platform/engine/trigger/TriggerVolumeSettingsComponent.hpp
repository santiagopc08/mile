#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_SETTINGS_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    enum class VolumeShape
    {
        Rectangle,
        Circle,
        Capsule,
        Polygon
    };

    enum class VolumeZoneType
    {
        Area,
        Portal,
        HazardZone,
        BuffZone,
        Checkpoint,
        CameraZone
    };

    struct TriggerVolumeSettingsComponent
    {
        uint32_t volumeID{0};
        VolumeShape shape{VolumeShape::Rectangle};
        VolumeZoneType zoneType{VolumeZoneType::Area};
        glm::vec2 bounds{2.0f, 2.0f};
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_SETTINGS_COMPONENT_HPP
