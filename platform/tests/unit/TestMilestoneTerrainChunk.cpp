#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/terrain/TerrainChunkSettingsComponent.hpp"
#include "engine/terrain/TerrainChunkRuntimeComponent.hpp"
#include "engine/terrain/ChunkManager.hpp"
#include "engine/terrain/ChunkValidationController.hpp"
#include "engine/terrain/TerrainSystem.hpp"

TEST_CASE("GAME-001-MS009 Terrain Chunk Partitioning & Spatial Indexing", "[MS009]")
{
    platform::Scene scene("Test Chunk Scene");
    auto &registry = scene.GetRegistry();

    platform::ChunkManager chunkManager;
    platform::EntityID c0 = chunkManager.createChunk(registry, 0, 1337, 200.0f);
    platform::EntityID c1 = chunkManager.createChunk(registry, 1, 1337, 200.0f);

    REQUIRE(c0 != platform::kNullEntity);
    REQUIRE(c1 != platform::kNullEntity);

    REQUIRE(chunkManager.chunkCount() == 2);
    REQUIRE(chunkManager.activeChunks() == 2);

    // Spatial Indexing Queries
    REQUIRE(chunkManager.getChunk(0) == c0);
    REQUIRE(chunkManager.getChunk(1) == c1);
    REQUIRE(chunkManager.getChunkByPosition({50.0f, 0.0f}) == c0);
    REQUIRE(chunkManager.getChunkByPosition({250.0f, 0.0f}) == c1);
    REQUIRE(chunkManager.getNeighbor(0, 1) == c1);

    // Point Container Queries
    REQUIRE(chunkManager.containsPoint(c0, {100.0f, 0.0f}, registry));
    REQUIRE_FALSE(chunkManager.containsPoint(c0, {300.0f, 0.0f}, registry));
}

TEST_CASE("GAME-001-MS009 Chunk Validation Controller Sequence Execution", "[MS009]")
{
    platform::Scene scene("Test Chunk Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::ChunkManager chunkManager;
    platform::TerrainSystem terrainSystem;
    platform::ChunkValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::ChunkValidationState::GenerateWorld);

    // Run updates to cycle through autonomous chunk validation sequence
    for (int i = 0; i < 60; ++i)
    {
        valController.Update(registry, chunkManager, terrainSystem, 1337, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
