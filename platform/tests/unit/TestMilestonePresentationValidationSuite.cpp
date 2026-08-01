#include <catch2/catch_test_macros.hpp>

#include "engine/ui/PresentationValidationSuite.hpp"

TEST_CASE("GAME-001-MS027 Presentation Framework Validation Suite & JSON Report", "[MS027]")
{
    platform::PresentationValidationSuite suite;
    platform::PresentationValidationReport report = suite.RunFullValidation();

    REQUIRE(report.passed);
    REQUIRE(report.audioVoices > 0);
    REQUIRE(report.effectCount > 0);
    REQUIRE(report.widgetCount > 0);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"cameraState\": \"Tracking\"") != std::string::npos);
}
