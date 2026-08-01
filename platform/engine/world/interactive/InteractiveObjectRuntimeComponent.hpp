#ifndef PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_OBJECT_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_OBJECT_RUNTIME_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    struct InteractiveObjectRuntimeComponent
    {
        bool activated{false};
        EntityID activator{kNullEntity};
    };
}

#endif // PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_OBJECT_RUNTIME_COMPONENT_HPP
