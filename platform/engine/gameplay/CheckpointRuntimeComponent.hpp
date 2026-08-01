#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_RUNTIME_COMPONENT_HPP

namespace platform
{
    struct CheckpointRuntimeComponent
    {
        bool activated{false};
        double activationTime{0.0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_RUNTIME_COMPONENT_HPP
