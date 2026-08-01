#include <catch2/catch_test_macros.hpp>

#include "engine/level/LevelValidationSuite.hpp"

TEST_CASE("GAME-002-MS026 Level Validation Suite Automated Pipeline & JSON Report", "[MS026]")
{
    platform::LevelValidationSuite suite;
    platform::LevelValidationReport report = suite.RunLevelValidation();

    REQUIRE(report.passed);
    REQUIRE(report.currentLevel == "Level 1-1");
    REQUIRE(report.npcCount == 1);
    REQUIRE(report.bossPhase == 3);
    REQUIRE(report.portalActive);
    REQUIRE(report.progressCompletion == 100.0f);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"progressCompletion\": 100.0") != std::string::npos);
}
