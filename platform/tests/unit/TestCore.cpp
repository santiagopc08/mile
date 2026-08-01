#include <catch2/catch_test_macros.hpp>
#include "engine/core/Time.hpp"

TEST_CASE("Time subsystem tracking", "[core]")
{
    platform::Time time;
    REQUIRE(time.GetDeltaTime() == 0.0);
    REQUIRE(time.GetElapsedTime() == 0.0);
    REQUIRE(time.GetFrameCounter() == 0);

    time.Update(0.016);
    REQUIRE(time.GetDeltaTime() == 0.016);
    REQUIRE(time.GetElapsedTime() == 0.016);
    REQUIRE(time.GetFrameCounter() == 1);
}
