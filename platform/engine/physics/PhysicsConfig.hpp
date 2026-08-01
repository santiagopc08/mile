#ifndef PLATFORM_ENGINE_PHYSICS_PHYSICS_CONFIG_HPP
#define PLATFORM_ENGINE_PHYSICS_PHYSICS_CONFIG_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct PhysicsConfig
    {
        glm::vec2 Gravity{0.0f, 9.81f}; // Downwards gravity
        int VelocityIterations{8};
        int PositionIterations{3};
        double FixedTimeStep{1.0 / 60.0};
        int MaximumSubSteps{5};
        bool SleepEnabled{true};
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_PHYSICS_CONFIG_HPP
