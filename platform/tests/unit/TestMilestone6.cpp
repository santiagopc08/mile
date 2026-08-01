#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/terrain/TerrainConfig.hpp"
#include "engine/terrain/TerrainGenerator.hpp"
#include "engine/terrain/TerrainChunk.hpp"
#include "engine/terrain/TerrainManager.hpp"
#include "examples/hill_climb/TerrainValidationScene.hpp"

TEST_CASE("TerrainGenerator Deterministic Sampling", "[Terrain]")
{
    platform::TerrainConfig config;
    config.GenerationSeed = 48192;

    platform::TerrainGenerator gen1(config);
    platform::TerrainGenerator gen2(config);

    float h1 = gen1.GetHeight(150.0f);
    float h2 = gen2.GetHeight(150.0f);

    REQUIRE(h1 == Catch::Approx(h2));
    REQUIRE(gen1.GetSlope(150.0f) == Catch::Approx(gen2.GetSlope(150.0f)));

    auto sample = gen1.SampleHeight(150.0f);
    REQUIRE(sample.Valid);
    REQUIRE(sample.Height == Catch::Approx(h1));
    REQUIRE(glm::length(sample.Normal) == Catch::Approx(1.0f));
}

TEST_CASE("Catmull-Rom Spline Interpolation Continuity", "[Terrain]")
{
    float p0 = 100.0f;
    float p1 = 150.0f;
    float p2 = 200.0f;
    float p3 = 180.0f;

    // At t=0, spline equals P1; at t=1, spline equals P2
    REQUIRE(platform::TerrainGenerator::CatmullRom(p0, p1, p2, p3, 0.0f) == Catch::Approx(p1));
    REQUIRE(platform::TerrainGenerator::CatmullRom(p0, p1, p2, p3, 1.0f) == Catch::Approx(p2));
}

TEST_CASE("TerrainChunk Generation and Bounds", "[Terrain]")
{
    platform::TerrainConfig config;
    platform::TerrainGenerator gen(config);

    platform::TerrainChunk chunk(2, 1000.0f, 500.0f);
    REQUIRE(chunk.GetChunkIndex() == 2);
    REQUIRE(chunk.GetStartX() == 1000.0f);
    REQUIRE(chunk.GetEndX() == 1500.0f);

    chunk.Generate(gen, config);
    REQUIRE(chunk.GetState() == platform::ChunkState::Generated);
    REQUIRE_FALSE(chunk.GetSurfacePoints().empty());
}

TEST_CASE("TerrainManager Chunk Streaming Radius", "[Terrain]")
{
    platform::TerrainConfig config;
    config.ChunkWidth = 500.0f;
    config.StreamingDistance = 1000.0f; // Radius = 2 chunks

    platform::TerrainManager manager(config);
    platform::PhysicsWorld physicsWorld;
    physicsWorld.Initialize();

    manager.UpdateStreaming({0.0f, 0.0f}, physicsWorld);
    REQUIRE(manager.GetLoadedChunkCount() > 0);

    // Move camera 5000 units away -> old chunks should be un-streamed
    manager.UpdateStreaming({5000.0f, 0.0f}, physicsWorld);
    REQUIRE(manager.GetChunks().find(0) == manager.GetChunks().end());

    manager.Shutdown(physicsWorld);
}

TEST_CASE("TerrainValidationScene Execution", "[TerrainScene]")
{
    platform::TerrainValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    scene.Update(0.016);
    scene.Deactivate();
    scene.Shutdown();
}
