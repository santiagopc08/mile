#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct CheckpointSettingsComponent
    {
        uint32_t index{0};
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_SETTINGS_COMPONENT_HPP
