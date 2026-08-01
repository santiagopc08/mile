#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/gameplay/fuel/FuelSystem.hpp"
#include "engine/gameplay/fuel/FuelComponent.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/gameplay/collectibles/CollectibleSpawner.hpp"
#include "engine/gameplay/collectibles/CollectibleComponent.hpp"
#include "examples/hill_climb/ProgressionValidationScene.hpp"

TEST_CASE("FuelSystem Depletion and Refilling", "[Progression]")
{
    platform::Registry registry;
    platform::EntityID vehicle = registry.CreateEntity("Vehicle");
    auto &fuel = registry.AddComponent<platform::FuelComponent>(vehicle);
    fuel.MaximumFuel = 100.0f;
    fuel.CurrentFuel = 100.0f;
    fuel.ConsumptionRate = 10.0f;

    platform::FuelSystem fuelSystem;
    fuelSystem.Update(registry, vehicle, nullptr, 1.0); // 1 sec

    // Idle consumption + base consumption
    REQUIRE(fuel.CurrentFuel < 100.0f);

    fuelSystem.Refill(registry, vehicle, 20.0f, nullptr);
    REQUIRE(fuel.CurrentFuel == Catch::Approx(100.0f));
}

TEST_CASE("ScoreSystem Formula", "[Progression]")
{
    platform::ScoreSystem scoreSystem;
    scoreSystem.UpdateDistance(500.0f);
    scoreSystem.AddCoins(10);

    // Score = Distance (500) + Coins (10 * 100 = 1000) = 1500
    REQUIRE(scoreSystem.GetScore() == 1500);
}

TEST_CASE("CollectibleSpawner procedural placement", "[Progression]")
{
    platform::Registry registry;
    platform::TerrainManager terrainManager;
    platform::TerrainConfig config;
    terrainManager.Initialize(config);

    platform::CollectibleSpawner spawner;
    spawner.SpawnCollectiblesAlongTerrain(registry, terrainManager, 100.0f, 500.0f);

    // Should spawn multiple coin entities along 400m
    auto view = registry.GetView<platform::CollectibleComponent>();
    size_t count = 0;
    view.Each([&count](platform::EntityID id, platform::CollectibleComponent &c) {
        (void)id;
        (void)c;
        count++;
    });

    REQUIRE(count > 0);
}

TEST_CASE("ProgressionValidationScene Execution", "[ProgressionScene]")
{
    platform::ProgressionValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    scene.Update(0.016);
    REQUIRE(scene.GetScoreSystem().GetScore() >= 0);

    scene.Deactivate();
    scene.Shutdown();
}
