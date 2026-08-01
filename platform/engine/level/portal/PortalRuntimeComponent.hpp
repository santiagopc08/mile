#ifndef PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_RUNTIME_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    struct PortalRuntimeComponent
    {
        bool active{true};
        bool occupied{false};
        EntityID traveler{kNullEntity};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_RUNTIME_COMPONENT_HPP
