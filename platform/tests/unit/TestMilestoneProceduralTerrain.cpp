#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/terrain/TerrainSettingsComponent.hpp"
#include "engine/terrain/TerrainRuntimeComponent.hpp"
#include "engine/terrain/TerrainSystem.hpp"
#include "engine/terrain/TerrainValidationController.hpp"
#include "examples/hill_climb/TerrainValidationScene.hpp"

TEST_CASE("GAME-001-MS008 Procedural Terrain Deterministic Generation", "[MS008]")
{
    platform::Scene scene("Test Terrain Scene");
    auto &registry = scene.GetRegistry();

    platform::TerrainSystem terrainSystem;
    platform::EntityID terrainEntity = terrainSystem.generate(registry, 1337, 2000.0f);

    REQUIRE(terrainEntity != platform::kNullEntity);

    auto *settings = registry.GetComponent<platform::TerrainSettingsComponent>(terrainEntity);
    auto *runtime = registry.GetComponent<platform::TerrainRuntimeComponent>(terrainEntity);

    REQUIRE(settings != nullptr);
    REQUIRE(runtime != nullptr);
    REQUIRE(terrainSystem.currentSeed(*runtime) == 1337);
    REQUIRE(terrainSystem.terrainLength(*runtime) == 2000.0f);

    // Verify Deterministic Height Generation
    float h1 = terrainSystem.getHeight(*settings, 150.0f);
    float h2 = terrainSystem.getHeight(*settings, 150.0f);
    REQUIRE(h1 == h2);

    // Changing seed alters height
    terrainSystem.setSeed(*settings, 9999);
    float h3 = terrainSystem.getHeight(*settings, 150.0f);
    REQUIRE(h1 != h3);
}

TEST_CASE("GAME-001-MS008 Terrain Validation Controller Sequence Execution", "[MS008]")
{
    platform::Scene scene("Test Terrain Controller Scene");
    auto &registry = scene.GetRegistry();

    platform::TerrainSystem terrainSystem;
    platform::EntityID terrainEntity = terrainSystem.generate(registry, 1337, 2000.0f);

    platform::TerrainValidationController valController;
    valController.Initialize();
    REQUIRE(valController.GetState() == platform::TerrainValidationState::GenerateTerrain);

    // Run updates to cycle through autonomous terrain sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, terrainSystem, terrainEntity, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}

TEST_CASE("GAME-001-MS008 Terrain Validation Scene Simulation", "[MS008]")
{
    platform::TerrainValidationScene scene;
    scene.Initialize();

    for (int i = 0; i < 15; ++i)
    {
        scene.Update(0.016);
    }

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    scene.Shutdown();
}
