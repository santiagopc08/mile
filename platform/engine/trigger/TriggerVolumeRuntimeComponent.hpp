#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_RUNTIME_COMPONENT_HPP

#include "engine/scene/Entity.hpp"
#include <unordered_set>

namespace platform
{
    struct TriggerVolumeRuntimeComponent
    {
        bool occupied{false};
        std::unordered_set<EntityID> occupants{};
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_VOLUME_RUNTIME_COMPONENT_HPP
