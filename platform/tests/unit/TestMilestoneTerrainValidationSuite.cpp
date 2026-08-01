#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/terrain/TerrainValidationSuite.hpp"

TEST_CASE("GAME-001-MS013 Complete Terrain Framework Validation Suite & JSON Report", "[MS013]")
{
    platform::Scene scene("Test Terrain Integration Scene");
    auto &registry = scene.GetRegistry();

    platform::TerrainValidationSuite suite;
    platform::TerrainValidationReport report = suite.RunFullValidation(registry, 1337);

    REQUIRE(report.passed);
    REQUIRE(report.chunkCount == 50);
    REQUIRE(report.obstacleCount == 10);
    REQUIRE(report.materialCount == 3);
    REQUIRE(report.driveDistanceMeters == 20000.0);
    REQUIRE(report.runtimeWarnings == 0);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"chunkCount\": 50") != std::string::npos);
}
