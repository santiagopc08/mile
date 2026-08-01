#include <catch2/catch_test_macros.hpp>

#include "engine/release/ReleaseValidationSuite.hpp"

TEST_CASE("GAME-001-MS033 Production Release Candidate Validation Suite & JSON Report", "[MS033]")
{
    platform::ReleaseValidationSuite suite;
    platform::ReleaseValidationReport report = suite.RunProductionValidation();

    REQUIRE(report.passed);
    REQUIRE(report.buildProfile == "Release");
    REQUIRE(report.totalMilestonesVerified == 33);
    REQUIRE(report.runtimeWarnings == 0);
    REQUIRE(report.memoryLeaks == 0);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"totalMilestonesVerified\": 33") != std::string::npos);
}
