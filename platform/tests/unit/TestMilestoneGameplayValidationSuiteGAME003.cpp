#include <catch2/catch_test_macros.hpp>

#include "engine/gameplay/GameplayValidationSuiteGAME003.hpp"

TEST_CASE("GAME-003-MS012 Gameplay Stack (EPIC-002) Integration & JSON Report", "[MS012]")
{
    platform::GameplayValidationSuiteGAME003 suite;
    platform::GameplayValidationReportGAME003 report = suite.RunGameplayValidation();

    REQUIRE(report.passed);
    REQUIRE(report.simulationTick == 60);
    REQUIRE(report.activeModifiers == 1);
    REQUIRE(report.triggerVolumeOccupied);
    REQUIRE(report.hazardActive);
    REQUIRE(report.checkpointRestored);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"simulationTick\": 60") != std::string::npos);
}
