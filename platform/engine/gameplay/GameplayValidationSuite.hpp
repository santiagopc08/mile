#ifndef PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_HPP

#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/gameplay/resources/ResourceSystem.hpp"
#include "engine/gameplay/collectibles/CollectibleSystem.hpp"
#include "engine/gameplay/progress/ProgressTrackingSystem.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/gameplay/CheckpointSystem.hpp"
#include "engine/gameplay/failure/FailureSystem.hpp"
#include "engine/gameplay/VehicleRecoverySystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    struct GameplayValidationReport
    {
        bool passed{true};
        double distanceMeters{0.0};
        float fuelRemaining{0.0f};
        uint64_t score{0};
        uint32_t coinsCollected{0};
        uint32_t checkpointsActivated{0};
        uint32_t recoveryCount{0};
        uint32_t failureCount{0};
        double frameTimeMs{0.0};
        size_t memoryBytes{0};
        double cpuTimeMs{0.0};

        [[nodiscard]] std::string ToJSON() const;
    };

    class GameplayValidationSuite
    {
    public:
        GameplayValidationSuite() = default;

        GameplayValidationReport RunFullValidation(Registry &registry);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_HPP
