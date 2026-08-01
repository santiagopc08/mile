#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    struct CheckpointComponent
    {
        int Sequence{0};
        glm::vec2 Position{0.0f, 0.0f};
        bool Activated{false};
        float Radius{50.0f};
        uint64_t Timestamp{0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_COMPONENT_HPP
