#include <catch2/catch_test_macros.hpp>

#include "engine/gameplay/GameplayValidationSuiteMS18.hpp"

TEST_CASE("GAME-002-MS018 Gameplay Validation Suite Automated Pipeline & JSON Report", "[MS018]")
{
    platform::GameplayValidationSuiteMS18 suite;
    platform::GameplayValidationReportMS18 report = suite.RunGameplayValidation();

    REQUIRE(report.passed);
    REQUIRE(report.enemyCount == 1);
    REQUIRE(report.inventorySize == 1);
    REQUIRE(report.combatEvents == 2);

    // Verify Report JSON format export for CI integration
    std::string json = report.ToJSON();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"passed\": true") != std::string::npos);
    REQUIRE(json.find("\"combatEvents\": 2") != std::string::npos);
}
