#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/gameplay/GameplayValidationSuite.hpp"

TEST_CASE("GAME-001-MS020 Gameplay Framework Validation Suite & JSON Report", "[MS020]")
{
    platform::Scene scene("Test Gameplay Integration Scene");
    auto &registry = scene.GetRegistry();

    platform::GameplayValidationSuite suite;
    platform::GameplayValidationReport report = suite.RunFullValidation(registry);

    REQUIRE(report.passed);
    REQUIRE(report.distanceMeters > 0.0);
    REQUIRE(report.checkpointsActivated == 1);
    REQUIRE(report.recoveryCount == 1);
    REQUIRE(report.failureCount == 1);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"checkpointsActivated\": 1") != std::string::npos);
}
