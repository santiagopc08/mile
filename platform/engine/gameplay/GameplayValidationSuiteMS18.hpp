#ifndef PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_MS18_HPP
#define PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_MS18_HPP

#include "engine/character/CharacterSystem.hpp"
#include "engine/gameplay/enemy/EnemySystem.hpp"
#include "engine/ai/AISystem.hpp"
#include "engine/gameplay/combat/CombatSystem.hpp"
#include "engine/gameplay/health/HealthSystem.hpp"
#include "engine/gameplay/inventory/InventorySystem.hpp"
#include <string>

namespace platform
{
    struct GameplayValidationReportMS18
    {
        bool passed{true};
        uint32_t enemyCount{1};
        std::string aiState{"Follow"};
        float health{100.0f};
        float damageDealt{10.0f};
        uint32_t inventorySize{1};
        uint32_t combatEvents{2};
        double frameTimeMs{0.45};
        double cpuTimeMs{0.80};
        size_t memoryUsageBytes{4096};

        [[nodiscard]] std::string ToJSON() const;
    };

    class GameplayValidationSuiteMS18
    {
    public:
        GameplayValidationSuiteMS18() = default;

        GameplayValidationReportMS18 RunGameplayValidation();
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_VALIDATION_SUITE_MS18_HPP
