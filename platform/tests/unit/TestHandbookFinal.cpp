#include <catch2/catch_test_macros.hpp>
#include <optional>
#include <expected>
#include <string>

#include "engine/core/time/Stopwatch.hpp"
#include "engine/assets/AssetID.hpp"

struct SerializableTestObject
{
    uint32_t Version{1};
    std::string Type{"TestObject"};
    platform::AssetID UUID{123456789};

    [[nodiscard]] bool Serialize() const { return Version > 0 && !Type.empty(); }
};

std::expected<int, std::string> DivideNumbers(int a, int b)
{
    if (b == 0) return std::unexpected("Division by zero");
    return a / b;
}

TEST_CASE("HANDBOOK-019 API Design std::expected and std::optional Return Semantics", "[FinalHandbook]")
{
    auto successResult = DivideNumbers(10, 2);
    REQUIRE(successResult.has_value());
    REQUIRE(successResult.value() == 5);

    auto errorResult = DivideNumbers(10, 0);
    REQUIRE(!errorResult.has_value());
    REQUIRE(errorResult.error() == "Division by zero");
}

TEST_CASE("HANDBOOK-020 Serialization Versioning & UUID Identity", "[FinalHandbook]")
{
    SerializableTestObject obj;
    REQUIRE(obj.Serialize());
    REQUIRE(obj.Version == 1);
    REQUIRE(obj.UUID == 123456789);
}

TEST_CASE("HANDBOOK-024 Performance Guidelines Stopwatch Budgeting", "[FinalHandbook]")
{
    platform::Stopwatch stopwatch;
    double elapsedMs = stopwatch.ElapsedMilliseconds();
    REQUIRE(elapsedMs >= 0.0);
    REQUIRE(elapsedMs < 500.0); // Runtime startup performance budget < 500 ms
}
