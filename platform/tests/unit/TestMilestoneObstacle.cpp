#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/terrain/ObstacleSettingsComponent.hpp"
#include "engine/terrain/ObstacleRuntimeComponent.hpp"
#include "engine/terrain/ObstacleManager.hpp"
#include "engine/terrain/ObstacleValidationController.hpp"

TEST_CASE("GAME-001-MS012 Obstacle Framework & Placement", "[MS012]")
{
    platform::Scene scene("Test Obstacle Scene");
    auto &registry = scene.GetRegistry();

    platform::ObstacleManager obsManager;
    platform::EntityID rock = obsManager.spawnObstacle(registry, platform::ObstacleType::Rock, {100.0f, 200.0f}, 0);
    platform::EntityID crate = obsManager.spawnObstacle(registry, platform::ObstacleType::Crate, {300.0f, 200.0f}, 1);

    REQUIRE(rock != platform::kNullEntity);
    REQUIRE(crate != platform::kNullEntity);
    REQUIRE(obsManager.obstacleCount() == 2);

    REQUIRE(obsManager.findObstacle(rock) == rock);
    REQUIRE(obsManager.findObstacle(crate) == crate);

    obsManager.destroyObstacle(registry, rock);
    REQUIRE(obsManager.obstacleCount() == 1);
}

TEST_CASE("GAME-001-MS012 Obstacle Validation Controller Sequence Execution", "[MS012]")
{
    platform::Scene scene("Test Obstacle Controller Scene");
    auto &registry = scene.GetRegistry();

    platform::ObstacleManager obsManager;
    platform::EntityID vehicle = registry.CreateEntity("Vehicle");
    platform::ObstacleValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::ObstacleValidationState::GenerateTerrain);

    // Run updates to cycle through autonomous obstacle validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, obsManager, vehicle, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
