#ifndef PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct ScoreRuntimeComponent
    {
        uint64_t score{0};
        uint64_t bestScore{0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_SCORE_SCORE_RUNTIME_COMPONENT_HPP
