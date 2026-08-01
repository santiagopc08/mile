#include <catch2/catch_test_macros.hpp>

#include "engine/release/ReleaseValidationSuiteGAME002.hpp"

TEST_CASE("GAME-002-MS031 GAME-002 v1.0 Release Candidate 31-Milestone Automated Pipeline Validation", "[MS031]")
{
    platform::ReleaseValidationSuiteGAME002 suite;
    platform::ReleaseValidationReportGAME002 report = suite.RunReleaseValidation();

    REQUIRE(report.passed);
    REQUIRE(report.characterStackPassed);
    REQUIRE(report.worldStackPassed);
    REQUIRE(report.gameplayStackPassed);
    REQUIRE(report.levelStackPassed);
    REQUIRE(report.presentationStackPassed);
    REQUIRE(report.audioStackPassed);
    REQUIRE(report.vfxStackPassed);
    REQUIRE(report.performanceBudgetsPassed);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"version\": \"v1.0.0-RC\"") != std::string::npos);
}
