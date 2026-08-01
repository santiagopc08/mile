#include <catch2/catch_test_macros.hpp>

#include "engine/world/WorldValidationSuite.hpp"

TEST_CASE("GAME-002-MS012 World Validation Suite Automated Pipeline & JSON Report", "[MS012]")
{
    platform::WorldValidationSuite suite;
    platform::WorldValidationReport report = suite.RunWorldValidation();

    REQUIRE(report.passed);
    REQUIRE(report.tileCount > 0);
    REQUIRE(report.chunkCount == 4);
    REQUIRE(report.objectCount == 10);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"chunkCount\": 4") != std::string::npos);
}
