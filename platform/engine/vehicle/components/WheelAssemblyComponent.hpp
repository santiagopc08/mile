#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_ASSEMBLY_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_ASSEMBLY_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    struct WheelAssemblyComponent
    {
        EntityID body{kNullEntity};
        EntityID wheel{kNullEntity};
        EntityID joint{kNullEntity};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_ASSEMBLY_COMPONENT_HPP
