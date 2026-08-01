#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/character/jump/JumpSettingsComponent.hpp"
#include "engine/character/jump/JumpRuntimeComponent.hpp"
#include "engine/character/jump/JumpSystem.hpp"
#include "engine/character/jump/JumpValidationController.hpp"

TEST_CASE("GAME-002-MS003 Jump Framework & Locomotion Integration", "[MS003]")
{
    platform::Scene scene("Test Jump Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::JumpSystem jumpSystem;

    platform::EntityID player = charSystem.spawnCharacter(registry, 1, platform::CharacterType::Player, {0.0f, 0.0f});

    REQUIRE(jumpSystem.canJump(registry, player));
    REQUIRE(jumpSystem.jumpState(registry, player) == platform::JumpState::Ready);
    REQUIRE_FALSE(jumpSystem.isJumping(registry, player));

    // Request jump
    jumpSystem.requestJump(registry, player);
    REQUIRE(jumpSystem.isJumping(registry, player));
    REQUIRE(jumpSystem.jumpState(registry, player) == platform::JumpState::Jumping);

    // Cancel jump early (variable height test)
    jumpSystem.cancelJump(registry, player);

    // Update system frame
    jumpSystem.Update(registry, 0.016);
    REQUIRE(jumpSystem.jumpState(registry, player) == platform::JumpState::Ascending);

    // Reset jump
    jumpSystem.resetJump(registry, player);
    REQUIRE_FALSE(jumpSystem.isJumping(registry, player));

    // Profiler metrics check (POLICY-006)
    auto metrics = jumpSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS003 Jump Validation Controller Autonomous Sequence", "[MS003]")
{
    platform::Scene scene("Test Jump Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::CharacterMovementSystem moveSystem;
    platform::JumpSystem jumpSystem;
    platform::JumpValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::JumpValidationState::Walk);

    // Run updates to cycle through autonomous jump validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, charSystem, moveSystem, jumpSystem, 0.016);
        jumpSystem.Update(registry, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
