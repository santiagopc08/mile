#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/gameplay/resources/ResourceSettingsComponent.hpp"
#include "engine/gameplay/resources/ResourceRuntimeComponent.hpp"
#include "engine/gameplay/resources/ResourceSystem.hpp"
#include "engine/gameplay/collectibles/CollectibleSettingsComponent.hpp"
#include "engine/gameplay/collectibles/CollectibleRuntimeComponent.hpp"
#include "engine/gameplay/collectibles/CollectibleSystem.hpp"
#include "engine/gameplay/progress/ProgressTrackingSystem.hpp"
#include "engine/gameplay/score/ScoreSettingsComponent.hpp"
#include "engine/gameplay/score/ScoreRuntimeComponent.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/gameplay/CheckpointSettingsComponent.hpp"
#include "engine/gameplay/CheckpointRuntimeComponent.hpp"
#include "engine/gameplay/CheckpointSystem.hpp"
#include "engine/gameplay/failure/FailureSettingsComponent.hpp"
#include "engine/gameplay/failure/FailureRuntimeComponent.hpp"
#include "engine/gameplay/failure/FailureSystem.hpp"
#include "engine/scene/components/Components.hpp"

TEST_CASE("GAME-001-MS014 Resource Framework (Fuel, Energy, Health)", "[MS014]")
{
    platform::Scene scene("Test Resource Scene");
    auto &registry = scene.GetRegistry();

    platform::ResourceSystem resourceSystem;
    platform::EntityID fuel = resourceSystem.createResource(registry, 1, "Fuel", 100.0f, 100.0f);
    REQUIRE(fuel != platform::kNullEntity);

    REQUIRE(resourceSystem.getValue(registry, fuel) == 100.0f);
    resourceSystem.consume(registry, fuel, 40.0f);
    REQUIRE(resourceSystem.getValue(registry, fuel) == 60.0f);

    resourceSystem.restore(registry, fuel, 20.0f);
    REQUIRE(resourceSystem.getValue(registry, fuel) == 80.0f);

    resourceSystem.consume(registry, fuel, 100.0f);
    REQUIRE(resourceSystem.getValue(registry, fuel) == 0.0f);
}

TEST_CASE("GAME-001-MS015 Collectible Framework (Coins, Fuel Packs)", "[MS015]")
{
    platform::Scene scene("Test Collectible Scene");
    auto &registry = scene.GetRegistry();

    platform::CollectibleSystem collectibleSystem;
    platform::EntityID coin = collectibleSystem.spawnCollectible(registry, platform::CollectibleType::Coin, {100.0f, 0.0f}, 50.0f);
    REQUIRE(coin != platform::kNullEntity);

    auto *runtime = registry.GetComponent<platform::CollectibleRuntimeComponent>(coin);
    REQUIRE(runtime != nullptr);
    REQUIRE_FALSE(runtime->collected);

    collectibleSystem.collect(registry, coin);
    REQUIRE(runtime->collected);

    collectibleSystem.resetCollectible(registry, coin);
    REQUIRE_FALSE(runtime->collected);
}

TEST_CASE("GAME-001-MS016 Progress Tracking Framework", "[MS016]")
{
    platform::Scene scene("Test Progress Scene");
    auto &registry = scene.GetRegistry();

    platform::EntityID vehicle = registry.CreateEntity("Vehicle");
    auto &tComp = registry.AddComponent<platform::TransformComponent>(vehicle);
    tComp.Position = {0.0f, 0.0f};

    platform::ProgressTrackingSystem progressSystem;
    progressSystem.Update(registry, vehicle, 0.016);

    tComp.Position = {100.0f, 0.0f};
    progressSystem.Update(registry, vehicle, 0.016);

    REQUIRE(progressSystem.distance() == 100.0);
    REQUIRE(progressSystem.statistics().maxDistanceMeters == 100.0);
}

TEST_CASE("GAME-001-MS017 Score Framework", "[MS017]")
{
    platform::ScoreSystem scoreSystem;
    platform::ScoreRuntimeComponent runtime;

    scoreSystem.addPoints(runtime, 500);
    REQUIRE(scoreSystem.score(runtime) == 500);
    REQUIRE(runtime.bestScore == 500);

    scoreSystem.removePoints(runtime, 200);
    REQUIRE(scoreSystem.score(runtime) == 300);

    scoreSystem.reset(runtime);
    REQUIRE(scoreSystem.score(runtime) == 0);
    REQUIRE(runtime.bestScore == 500);
}

TEST_CASE("GAME-001-MS018 Checkpoint Framework", "[MS018]")
{
    platform::Scene scene("Test Checkpoint Scene");
    auto &registry = scene.GetRegistry();

    platform::EntityID cp = registry.CreateEntity("Checkpoint");
    auto &tComp = registry.AddComponent<platform::TransformComponent>(cp);
    tComp.Position = {250.0f, 50.0f};

    platform::CheckpointSystem cpSystem;
    cpSystem.activate(registry, cp);

    REQUIRE(cpSystem.lastCheckpoint().x == 250.0f);
    REQUIRE(cpSystem.lastCheckpoint().y == 50.0f);

    platform::EntityID player = registry.CreateEntity("Player");
    registry.AddComponent<platform::TransformComponent>(player);

    cpSystem.restore(registry, player);
    auto *pTransform = registry.GetComponent<platform::TransformComponent>(player);
    REQUIRE(pTransform->Position.x == 250.0f);
}

TEST_CASE("GAME-001-MS019 Failure Framework & State Integration", "[MS019]")
{
    platform::Scene scene("Test Failure Scene");
    auto &registry = scene.GetRegistry();

    platform::EntityID vehicle = registry.CreateEntity("Vehicle");
    platform::FailureSystem failureSystem;
    platform::GameplayStateMachine stateMachine;

    stateMachine.TransitionTo(platform::MatchState::Playing);
    failureSystem.fail(registry, vehicle, platform::FailureType::FuelDepletion, stateMachine);

    REQUIRE(stateMachine.GetCurrentState() == platform::MatchState::Failed);
    REQUIRE(failureSystem.failureReason(registry, vehicle) == platform::FailureType::FuelDepletion);

    failureSystem.resetFailure(registry, vehicle);
    auto *runtime = registry.GetComponent<platform::FailureRuntimeComponent>(vehicle);
    REQUIRE_FALSE(runtime->failed);
}
