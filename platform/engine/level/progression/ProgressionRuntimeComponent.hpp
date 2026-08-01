#ifndef PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_RUNTIME_COMPONENT_HPP

#include "engine/level/LevelSettingsComponent.hpp"
#include <unordered_set>

namespace platform
{
    struct ProgressionRuntimeComponent
    {
        LevelID currentLevel{1};
        float completion{0.0f};
        std::unordered_set<LevelID> unlockedLevels{1};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_RUNTIME_COMPONENT_HPP
