#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_JOINT_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_JOINT_COMPONENT_HPP

#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>

namespace platform
{
    struct WheelJointComponent
    {
        EntityID body{kNullEntity};
        EntityID wheel{kNullEntity};
        glm::vec2 anchor{0.0f, 0.0f};
        bool enabled{true};
        void *jointHandle{nullptr};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_JOINT_COMPONENT_HPP
