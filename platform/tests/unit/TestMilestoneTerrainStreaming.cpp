#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/terrain/StreamingSettingsComponent.hpp"
#include "engine/terrain/StreamingRuntimeComponent.hpp"
#include "engine/terrain/StreamingSystem.hpp"
#include "engine/terrain/StreamingValidationController.hpp"
#include "engine/terrain/ChunkManager.hpp"
#include "engine/scene/components/Components.hpp"

TEST_CASE("GAME-001-MS010 World Streaming Framework Radius & Dynamic Loading", "[MS010]")
{
    platform::Scene scene("Test Streaming Scene");
    auto &registry = scene.GetRegistry();

    platform::ChunkManager chunkManager;
    platform::StreamingSystem streamingSystem;

    // Create Streamer Entity (Vehicle)
    platform::EntityID vehicle = registry.CreateEntity("TrackedVehicle");
    auto &vTransform = registry.AddComponent<platform::TransformComponent>(vehicle);
    vTransform.Position = {0.0f, 0.0f};
    streamingSystem.registerSource(vehicle, 1);

    // Create World Manager Entity
    platform::EntityID world = registry.CreateEntity("WorldStreamingManager");
    auto &sSettings = registry.AddComponent<platform::StreamingSettingsComponent>(world);
    auto &sRuntime = registry.AddComponent<platform::StreamingRuntimeComponent>(world);

    sSettings.loadRadius = 600.0f; // Load ~3 chunks in each direction

    streamingSystem.updateStreaming(registry, chunkManager, 1337, 0.016);
    REQUIRE(sRuntime.loadedChunks > 0);
    REQUIRE(chunkManager.chunkCount() > 0);

    // Drive forward 1000m
    vTransform.Position.x = 1000.0f;
    streamingSystem.updateStreaming(registry, chunkManager, 1337, 0.016);
    REQUIRE(sRuntime.centerChunk == 5);
}

TEST_CASE("GAME-001-MS010 Streaming Validation Controller Sequence Execution", "[MS010]")
{
    platform::Scene scene("Test Streaming Controller Scene");
    auto &registry = scene.GetRegistry();

    platform::ChunkManager chunkManager;
    platform::StreamingSystem streamingSystem;

    platform::EntityID vehicle = registry.CreateEntity("TrackedVehicle");
    registry.AddComponent<platform::TransformComponent>(vehicle);
    streamingSystem.registerSource(vehicle, 1);

    platform::EntityID world = registry.CreateEntity("WorldStreamingManager");
    registry.AddComponent<platform::StreamingSettingsComponent>(world);
    registry.AddComponent<platform::StreamingRuntimeComponent>(world);

    platform::StreamingValidationController valController;
    valController.Initialize();
    REQUIRE(valController.GetState() == platform::StreamingValidationState::SpawnVehicle);

    // Run updates to cycle through autonomous streaming validation sequence
    for (int i = 0; i < 60; ++i)
    {
        valController.Update(registry, chunkManager, streamingSystem, vehicle, 1337, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
