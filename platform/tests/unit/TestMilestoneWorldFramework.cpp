#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/world/tilemap/TilemapSettingsComponent.hpp"
#include "engine/world/tilemap/TilemapRuntimeComponent.hpp"
#include "engine/world/tilemap/TilemapSystem.hpp"
#include "engine/world/tilemap/TilemapValidationController.hpp"
#include "engine/world/tileset/TilesetManager.hpp"
#include "engine/world/tilemap/TilemapStreamingSystem.hpp"
#include "engine/world/interactive/InteractiveBlockSystem.hpp"
#include "engine/world/destructible/DestructibleSystem.hpp"

TEST_CASE("GAME-002-MS007 Tilemap Framework Operations & Layer Data", "[MS007]")
{
    platform::Scene scene("Test Tilemap Scene");
    auto &registry = scene.GetRegistry();

    platform::TilemapSystem tilemapSystem;
    platform::EntityID map = registry.CreateEntity("Tilemap");

    REQUIRE(tilemapSystem.loadTilemap(registry, map, "assets/tilemaps/world_1.json"));
    REQUIRE(tilemapSystem.tileCount(registry, map) > 0);
    REQUIRE(tilemapSystem.layerCount(registry, map) == 6);

    platform::TileData tile = tilemapSystem.getTile(registry, map, 0, 0);
    REQUIRE(tile.property == platform::TileProperty::Solid);

    glm::ivec2 tilePos = tilemapSystem.worldToTile(registry, map, {2.5f, 3.5f});
    REQUIRE(tilePos.x == 2);
    REQUIRE(tilePos.y == 3);

    // Profiler metrics check (POLICY-006)
    auto metrics = tilemapSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS007 Tilemap Validation Controller Autonomous Sequence", "[MS007]")
{
    platform::Scene scene("Test Tilemap Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::TilemapSystem tilemapSystem;
    platform::TilemapValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::TilemapValidationStep::LoadMap);

    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, tilemapSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}

TEST_CASE("GAME-002-MS008 Tileset Pipeline & Metadata Import", "[MS008]")
{
    platform::TilesetManager tilesetManager;
    REQUIRE(tilesetManager.loadTileset(1, "assets/tilesets/atlas_default.png"));
    REQUIRE(tilesetManager.findTile(1, 5));

    platform::TileDefinition def = tilesetManager.getTileDefinition(1, 5);
    REQUIRE(def.tileID == 5);
    REQUIRE(def.hasCollision);
}

TEST_CASE("GAME-002-MS009 Tilemap Dynamic Streaming", "[MS009]")
{
    platform::Scene scene("Test Streaming Scene");
    auto &registry = scene.GetRegistry();

    platform::TilemapSystem tilemapSystem;
    platform::TilemapStreamingSystem streamingSystem;

    platform::EntityID map = registry.CreateEntity("Tilemap");
    tilemapSystem.loadTilemap(registry, map, "assets/tilemaps/world_1.json");

    streamingSystem.UpdateStreaming(registry, map, {500.0f, 0.0f});
    REQUIRE(streamingSystem.activeChunksCount() == 4);
    REQUIRE(streamingSystem.isChunkLoaded(5));
}

TEST_CASE("GAME-002-MS010 Interactive Block Framework", "[MS010]")
{
    platform::Scene scene("Test Interactive Scene");
    auto &registry = scene.GetRegistry();

    platform::InteractiveBlockSystem blockSystem;
    platform::EntityID block = registry.CreateEntity("CoinBlock");

    REQUIRE_FALSE(blockSystem.isActivated(registry, block));
    REQUIRE(blockSystem.interact(registry, block, 10));
    REQUIRE(blockSystem.isActivated(registry, block));

    blockSystem.reset(registry, block);
    REQUIRE_FALSE(blockSystem.isActivated(registry, block));
}

TEST_CASE("GAME-002-MS011 Destructible Object Framework", "[MS011]")
{
    platform::Scene scene("Test Destructible Scene");
    auto &registry = scene.GetRegistry();

    platform::DestructibleSystem destructibleSystem;
    platform::EntityID crate = registry.CreateEntity("WoodCrate");

    REQUIRE_FALSE(destructibleSystem.isDestroyed(registry, crate));

    destructibleSystem.damage(registry, crate, 1);
    REQUIRE(destructibleSystem.isDestroyed(registry, crate));

    destructibleSystem.restore(registry, crate);
    REQUIRE_FALSE(destructibleSystem.isDestroyed(registry, crate));
}
