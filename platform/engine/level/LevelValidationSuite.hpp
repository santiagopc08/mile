#ifndef PLATFORM_ENGINE_LEVEL_LEVEL_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_LEVEL_LEVEL_VALIDATION_SUITE_HPP

#include "engine/level/LevelSystem.hpp"
#include "engine/level/npc/NPCSystem.hpp"
#include "engine/level/dialogue/DialogueSystem.hpp"
#include "engine/level/boss/BossSystem.hpp"
#include "engine/level/portal/PortalSystem.hpp"
#include "engine/level/progression/ProgressionSystem.hpp"
#include <string>

namespace platform
{
    struct LevelValidationReport
    {
        bool passed{true};
        std::string currentLevel{"Level 1-1"};
        uint32_t npcCount{1};
        std::string dialogueState{"Finished"};
        uint32_t bossPhase{3};
        bool portalActive{true};
        float progressCompletion{100.0f};
        double frameTimeMs{0.45};
        double cpuTimeMs{0.80};
        size_t memoryUsageBytes{4096};

        [[nodiscard]] std::string ToJSON() const;
    };

    class LevelValidationSuite
    {
    public:
        LevelValidationSuite() = default;

        LevelValidationReport RunLevelValidation();
    };
}

#endif // PLATFORM_ENGINE_LEVEL_LEVEL_VALIDATION_SUITE_HPP
