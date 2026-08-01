#include <catch2/catch_test_macros.hpp>

#include "engine/rhythm/RhythmValidationSuite.hpp"

TEST_CASE("GAME-003-MS006 Rhythm Core (EPIC-001) Integration & JSON Report", "[MS006]")
{
    platform::RhythmValidationSuite suite;
    platform::RhythmValidationReport report = suite.RunRhythmValidation();

    REQUIRE(report.passed);
    REQUIRE(report.currentTick == 60);
    REQUIRE(report.currentBeat == 2);
    REQUIRE(report.triggerCount >= 1);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"currentTick\": 60") != std::string::npos);
}
