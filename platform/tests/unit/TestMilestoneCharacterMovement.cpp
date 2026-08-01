#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/character/movement/CharacterMovementSettingsComponent.hpp"
#include "engine/character/movement/CharacterMovementRuntimeComponent.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/movement/MovementValidationController.hpp"

TEST_CASE("GAME-002-MS002 Character Movement Framework & Horizontal Locomotion", "[MS002]")
{
    platform::Scene scene("Test Movement Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::CharacterMovementSystem moveSystem;

    platform::EntityID player = charSystem.spawnCharacter(registry, 1, platform::CharacterType::Player, {0.0f, 0.0f});

    REQUIRE(moveSystem.movementMode(registry, player) == platform::MovementMode::Idle);
    REQUIRE(moveSystem.direction(registry, player) == platform::MovementDirection::Right);
    REQUIRE_FALSE(moveSystem.isMoving(registry, player));

    moveSystem.moveRight(registry, player, 1.0f);
    REQUIRE(moveSystem.desiredSpeed(registry, player) > 0.0f);

    // Update 5 frames to accelerate right
    for (int i = 0; i < 5; ++i)
    {
        moveSystem.Update(registry, 0.016);
    }
    REQUIRE(moveSystem.currentSpeed(registry, player) > 0.0f);
    REQUIRE(moveSystem.isMoving(registry, player));
    REQUIRE(moveSystem.movementMode(registry, player) == platform::MovementMode::Walking);

    // Enable running
    moveSystem.enableRunning(registry, player, true);
    moveSystem.moveRight(registry, player, 1.0f);
    for (int i = 0; i < 30; ++i)
    {
        moveSystem.Update(registry, 0.016);
    }
    REQUIRE(moveSystem.movementMode(registry, player) == platform::MovementMode::Running);

    // Stop
    moveSystem.stop(registry, player);
    for (int i = 0; i < 50; ++i)
    {
        moveSystem.Update(registry, 0.016);
    }
    REQUIRE_FALSE(moveSystem.isMoving(registry, player));

    // Profiler metrics check (POLICY-006)
    auto metrics = moveSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS002 Movement Validation Controller Autonomous Sequence", "[MS002]")
{
    platform::Scene scene("Test Movement Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::CharacterMovementSystem moveSystem;
    platform::MovementValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::MovementValidationState::Spawn);

    // Run updates to cycle through autonomous movement validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, charSystem, moveSystem, 0.016);
        moveSystem.Update(registry, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
