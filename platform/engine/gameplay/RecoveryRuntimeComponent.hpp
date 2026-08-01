#ifndef PLATFORM_ENGINE_GAMEPLAY_RECOVERY_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_RECOVERY_RUNTIME_COMPONENT_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct RecoveryRuntimeComponent
    {
        bool recoveryPending{false};
        float idleTimer{0.0f};
        float rollAngle{0.0f};
        bool recovering{false};
        int recoveryCount{0};
        glm::vec2 spawnPosition{0.0f, 0.0f};
        float spawnRotation{0.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_RECOVERY_RUNTIME_COMPONENT_HPP
