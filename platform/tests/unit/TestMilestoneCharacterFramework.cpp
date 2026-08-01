#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/character/CharacterComponent.hpp"
#include "engine/character/CharacterSettingsComponent.hpp"
#include "engine/character/CharacterRuntimeComponent.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/character/CharacterValidationController.hpp"

TEST_CASE("GAME-002-MS001 Character Framework Lifecycle & Component Hierarchy", "[MS001]")
{
    platform::Scene scene("Test Character Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::EntityID player = charSystem.spawnCharacter(registry, 1, platform::CharacterType::Player, {10.0f, 20.0f});

    REQUIRE(player != platform::kNullEntity);
    REQUIRE(charSystem.characterCount() == 1);
    REQUIRE(charSystem.getCharacter(1) == player);

    REQUIRE(charSystem.characterType(registry, player) == platform::CharacterType::Player);
    REQUIRE(charSystem.currentState(registry, player) == platform::CharacterState::Active);
    REQUIRE(charSystem.isGrounded(registry, player));

    charSystem.disableCharacter(registry, player);
    REQUIRE(charSystem.currentState(registry, player) == platform::CharacterState::Disabled);

    charSystem.enableCharacter(registry, player);
    REQUIRE(charSystem.currentState(registry, player) == platform::CharacterState::Active);

    charSystem.destroyCharacter(registry, player);
    REQUIRE(charSystem.characterCount() == 0);

    // Profiler metrics check (POLICY-006)
    auto metrics = charSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
    REQUIRE(metrics.lifetimeObjectsCreated == 1);
}

TEST_CASE("GAME-002-MS001 Character Validation Controller Autonomous Sequence", "[MS001]")
{
    platform::Scene scene("Test Character Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::CharacterValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::CharacterValidationState::SpawnCharacter);

    // Run updates to cycle through autonomous character validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, charSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
