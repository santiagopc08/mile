#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_RUNTIME_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    struct CheckpointRuntimeComponent
    {
        bool active{false};
        uint64_t simulationTick{0};
        double timelinePosition{0.0};
        glm::vec2 savedPlayerPosition{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_RUNTIME_COMPONENT_HPP
