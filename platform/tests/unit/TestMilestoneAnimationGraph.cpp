#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/animation/AnimationGraphSettingsComponent.hpp"
#include "engine/animation/AnimationGraphRuntimeComponent.hpp"
#include "engine/animation/AnimationControllerComponent.hpp"
#include "engine/animation/AnimationGraphSystem.hpp"
#include "engine/animation/AnimationValidationController.hpp"

TEST_CASE("GAME-002-MS004 Animation Graph Framework & State Evaluation", "[MS004]")
{
    platform::Scene scene("Test Animation Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::AnimationGraphSystem animSystem;

    platform::EntityID player = charSystem.spawnCharacter(registry, 1, platform::CharacterType::Player, {0.0f, 0.0f});

    animSystem.play(registry, player);
    REQUIRE(animSystem.currentState(registry, player) == "Idle");
    REQUIRE(animSystem.activeAnimation(registry, player) == "Anim_Idle");

    // Change parameter Speed -> Walk
    animSystem.setParameter(registry, player, "Speed", 3.0f);
    animSystem.Update(registry, 0.016);
    REQUIRE(animSystem.currentState(registry, player) == "Walk");
    REQUIRE(animSystem.activeAnimation(registry, player) == "Anim_Walk");

    // Change parameter Speed -> Run
    animSystem.setParameter(registry, player, "Speed", 8.0f);
    animSystem.Update(registry, 0.016);
    REQUIRE(animSystem.currentState(registry, player) == "Run");

    // Change parameter Grounded -> Jump / Fall
    animSystem.setParameter(registry, player, "Grounded", false);
    animSystem.setParameter(registry, player, "VerticalSpeed", 6.0f);
    animSystem.Update(registry, 0.016);
    REQUIRE(animSystem.currentState(registry, player) == "Jump");

    animSystem.setParameter(registry, player, "VerticalSpeed", -4.0f);
    animSystem.Update(registry, 0.016);
    REQUIRE(animSystem.currentState(registry, player) == "Fall");

    // Land -> Idle
    animSystem.setParameter(registry, player, "Grounded", true);
    animSystem.setParameter(registry, player, "Speed", 0.0f);
    animSystem.Update(registry, 0.016);
    REQUIRE(animSystem.currentState(registry, player) == "Idle");

    // Profiler metrics check (POLICY-006)
    auto metrics = animSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS004 Animation Validation Controller Autonomous Sequence", "[MS004]")
{
    platform::Scene scene("Test Animation Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::AnimationGraphSystem animSystem;
    platform::AnimationValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::AnimValidationStep::Idle);

    // Run updates to cycle through autonomous animation validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, charSystem, animSystem, 0.016);
        animSystem.Update(registry, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
