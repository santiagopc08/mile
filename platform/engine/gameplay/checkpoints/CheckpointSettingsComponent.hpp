#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_SETTINGS_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    struct CheckpointSettingsComponent
    {
        uint32_t checkpointID{0};
        glm::vec2 spawnPosition{0.0f, 0.0f};
        bool autoActivate{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_SETTINGS_COMPONENT_HPP
