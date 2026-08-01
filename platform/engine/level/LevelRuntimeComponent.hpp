#ifndef PLATFORM_ENGINE_LEVEL_LEVEL_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_LEVEL_RUNTIME_COMPONENT_HPP

namespace platform
{
    enum class LevelState
    {
        Load,
        Initialize,
        Playing,
        Completed,
        Unload
    };

    struct LevelRuntimeComponent
    {
        LevelState state{LevelState::Load};
        float playTime{0.0f};
        bool completed{false};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_LEVEL_RUNTIME_COMPONENT_HPP
