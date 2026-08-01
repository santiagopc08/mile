#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/gameplay/enemy/EnemySettingsComponent.hpp"
#include "engine/gameplay/enemy/EnemyRuntimeComponent.hpp"
#include "engine/gameplay/enemy/EnemyComponent.hpp"
#include "engine/gameplay/enemy/EnemySystem.hpp"
#include "engine/gameplay/enemy/EnemyValidationController.hpp"
#include "engine/ai/AISystem.hpp"
#include "engine/gameplay/combat/CombatSystem.hpp"
#include "engine/gameplay/health/HealthSystem.hpp"
#include "engine/gameplay/inventory/InventorySystem.hpp"

TEST_CASE("GAME-002-MS013 Enemy Framework Lifecycle & Queries", "[MS013]")
{
    platform::Scene scene("Test Enemy Scene");
    auto &registry = scene.GetRegistry();

    platform::EnemySystem enemySystem;
    platform::EntityID enemy = enemySystem.spawnEnemy(registry, platform::EnemyType::Walking, {10.0f, 0.0f});

    REQUIRE(enemySystem.isAlive(registry, enemy));
    REQUIRE(enemySystem.enemyCount() == 1);
    REQUIRE(enemySystem.enemyType(registry, enemy) == platform::EnemyType::Walking);

    platform::EntityID player = registry.CreateEntity("PlayerTarget");
    enemySystem.setTarget(registry, enemy, player);
    REQUIRE(enemySystem.currentTarget(registry, enemy) == player);

    enemySystem.destroyEnemy(registry, enemy);
    REQUIRE_FALSE(enemySystem.isAlive(registry, enemy));

    // Profiler metrics check (POLICY-006)
    auto metrics = enemySystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS013 Enemy Validation Controller Autonomous Sequence", "[MS013]")
{
    platform::Scene scene("Test Enemy Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::EnemySystem enemySystem;
    platform::EnemyValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::EnemyValidationStep::Spawn);

    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, enemySystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}

TEST_CASE("GAME-002-MS014 AI Framework Behaviors & Perception", "[MS014]")
{
    platform::Scene scene("Test AI Scene");
    auto &registry = scene.GetRegistry();

    platform::AISystem aiSystem;
    platform::EntityID enemy = registry.CreateEntity("AIEnemy");

    aiSystem.setBehavior(registry, enemy, platform::AIState::Patrol);
    REQUIRE(aiSystem.currentState(registry, enemy) == platform::AIState::Patrol);

    platform::EntityID player = registry.CreateEntity("Player");
    aiSystem.setTarget(registry, enemy, player);
    REQUIRE(aiSystem.currentState(registry, enemy) == platform::AIState::Follow);

    aiSystem.pauseAI(registry, enemy);
    REQUIRE(aiSystem.isPaused(registry, enemy));
}

TEST_CASE("GAME-002-MS015 Combat Framework Attack & Cooldown", "[MS015]")
{
    platform::Scene scene("Test Combat Scene");
    auto &registry = scene.GetRegistry();

    platform::CombatSystem combatSystem;
    platform::EntityID attacker = registry.CreateEntity("Attacker");
    platform::EntityID defender = registry.CreateEntity("Defender");

    REQUIRE(combatSystem.canAttack(registry, attacker));
    REQUIRE(combatSystem.attack(registry, attacker, defender));
    REQUIRE_FALSE(combatSystem.canAttack(registry, attacker));

    combatSystem.Update(registry, 0.6); // Exceed 0.5s cooldown
    REQUIRE(combatSystem.canAttack(registry, attacker));
}

TEST_CASE("GAME-002-MS016 Health Framework Damage & Revive", "[MS016]")
{
    platform::Scene scene("Test Health Scene");
    auto &registry = scene.GetRegistry();

    platform::HealthSystem healthSystem;
    platform::EntityID actor = registry.CreateEntity("Actor");

    REQUIRE_FALSE(healthSystem.isDead(registry, actor));
    healthSystem.damage(registry, actor, 30.0f);
    REQUIRE(healthSystem.currentHealth(registry, actor) == 70.0f);

    healthSystem.kill(registry, actor);
    REQUIRE(healthSystem.isDead(registry, actor));

    healthSystem.revive(registry, actor);
    REQUIRE_FALSE(healthSystem.isDead(registry, actor));
    REQUIRE(healthSystem.currentHealth(registry, actor) == 100.0f);
}

TEST_CASE("GAME-002-MS017 Inventory Framework Collection & Storage", "[MS017]")
{
    platform::Scene scene("Test Inventory Scene");
    auto &registry = scene.GetRegistry();

    platform::InventorySystem inventorySystem;
    platform::EntityID player = registry.CreateEntity("Player");

    REQUIRE_FALSE(inventorySystem.contains(registry, player, "Coin"));
    inventorySystem.addItem(registry, player, "Coin", 5);
    REQUIRE(inventorySystem.contains(registry, player, "Coin"));
    REQUIRE(inventorySystem.quantity(registry, player, "Coin") == 5);

    inventorySystem.removeItem(registry, player, "Coin", 2);
    REQUIRE(inventorySystem.quantity(registry, player, "Coin") == 3);

    inventorySystem.clear(registry, player);
    REQUIRE_FALSE(inventorySystem.contains(registry, player, "Coin"));
}
