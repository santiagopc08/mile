#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/terrain/TerrainMaterialSettingsComponent.hpp"
#include "engine/terrain/TerrainMaterialRuntimeComponent.hpp"
#include "engine/terrain/TerrainMaterialSystem.hpp"
#include "engine/terrain/TerrainMaterialValidationController.hpp"

TEST_CASE("GAME-001-MS011 Terrain Material Framework & Registration", "[MS011]")
{
    platform::Scene scene("Test Material Scene");
    auto &registry = scene.GetRegistry();

    platform::TerrainMaterialSystem matSystem;
    REQUIRE(matSystem.materialCount() == 3);

    auto grassOpt = matSystem.getMaterial(0);
    REQUIRE(grassOpt.has_value());
    REQUIRE(grassOpt->name == "Grass");
    REQUIRE(grassOpt->friction == 0.6f);

    platform::EntityID chunk = registry.CreateEntity("TestChunk");
    matSystem.setMaterial(registry, chunk, 0);

    auto *runtime = registry.GetComponent<platform::TerrainMaterialRuntimeComponent>(chunk);
    REQUIRE(runtime != nullptr);
    REQUIRE(matSystem.activeMaterial(*runtime) == 0);

    // Profiler metrics check (POLICY-006)
    auto metrics = matSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
    REQUIRE(metrics.activeObjects == 3);
}

TEST_CASE("GAME-001-MS011 Material Validation Controller Sequence Execution", "[MS011]")
{
    platform::Scene scene("Test Material Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::TerrainMaterialSystem matSystem;
    platform::EntityID chunk = registry.CreateEntity("TestChunk");
    platform::TerrainMaterialValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::TerrainMaterialValidationState::GenerateTerrain);

    // Run updates to cycle through autonomous material validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, matSystem, chunk, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
