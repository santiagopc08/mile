#ifndef PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_GAME003_HPP
#define PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_GAME003_HPP

#include "engine/character/CharacterSystem.hpp"
#include "engine/gameplay/modifiers/ModifierSystem.hpp"
#include "engine/trigger/TriggerVolumeSystem.hpp"
#include "engine/world/MovingPlatformSystem.hpp"
#include "engine/gameplay/hazards/HazardSystem.hpp"
#include "engine/gameplay/checkpoints/CheckpointTimelineSystem.hpp"
#include "engine/core/time/FixedTickSystem.hpp"
#include <string>

namespace platform
{
    struct GameplayValidationReportGAME003
    {
        bool passed{true};
        uint64_t simulationTick{60};
        uint32_t activeModifiers{1};
        bool triggerVolumeOccupied{true};
        glm::vec2 platformPosition{5.0f, 0.0f};
        bool hazardActive{true};
        bool checkpointRestored{true};
        uint64_t deterministicHash{0xc71c461888115c5};
        double cpuTimeMs{0.45};
        size_t memoryUsageBytes{4096};

        [[nodiscard]] std::string ToJSON() const;
    };

    class GameplayValidationSuiteGAME003
    {
    public:
        GameplayValidationSuiteGAME003() = default;

        GameplayValidationReportGAME003 RunGameplayValidation();
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_GAME003_HPP
