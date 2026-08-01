#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_MOTOR_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_MOTOR_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    struct VehicleMotorComponent
    {
        EntityID frontWheel{kNullEntity};
        EntityID rearWheel{kNullEntity};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_MOTOR_COMPONENT_HPP
