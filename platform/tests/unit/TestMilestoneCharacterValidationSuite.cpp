#include <catch2/catch_test_macros.hpp>

#include "engine/character/CharacterValidationSuite.hpp"

TEST_CASE("GAME-002-MS006 Character Validation Suite Automated Pipeline & JSON Report", "[MS006]")
{
    platform::CharacterValidationSuite suite;
    platform::CharacterValidationReport report = suite.RunCharacterValidation();

    REQUIRE(report.passed);
    REQUIRE(report.characterCount == 1);
    REQUIRE(report.groundContacts == 10);
    REQUIRE_FALSE(report.animationState.empty());

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"characterCount\": 1") != std::string::npos);
}
