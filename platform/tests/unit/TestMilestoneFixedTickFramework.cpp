#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/core/time/FixedTickSettingsComponent.hpp"
#include "engine/core/time/FixedTickRuntimeComponent.hpp"
#include "engine/core/time/FixedTickSystem.hpp"
#include "engine/core/time/FixedTickValidationController.hpp"

TEST_CASE("GAME-003-MS001 Fixed Gameplay Tick Framework Operations & Catch-up", "[MS001]")
{
    platform::Scene scene("Test Fixed Tick Scene");
    auto &registry = scene.GetRegistry();

    platform::FixedTickSystem tickSystem;
    platform::EntityID tickEntity = registry.CreateEntity("FixedTickController");

    REQUIRE(tickSystem.tickRate(registry, tickEntity) == 60);
    REQUIRE(tickSystem.isDeterministic(registry, tickEntity));

    uint32_t stepCounter = 0;
    tickSystem.tick(registry, tickEntity, 1.0 / 60.0, [&stepCounter](uint64_t) {
        stepCounter++;
    });

    REQUIRE(tickSystem.simulationTick(registry, tickEntity) == 1);
    REQUIRE(stepCounter == 1);

    // Test render interpolation alpha (0.5 delta at 60 Hz = 0.5 alpha)
    tickSystem.tick(registry, tickEntity, 0.5 / 60.0, nullptr);
    REQUIRE(tickSystem.renderAlpha(registry, tickEntity) >= 0.49);

    // Profiler metrics check (POLICY-006)
    auto metrics = tickSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Deterministic");
}

TEST_CASE("GAME-003-MS001 Fixed Gameplay Tick Validation Controller Autonomous Sequence", "[MS001]")
{
    platform::Scene scene("Test Fixed Tick Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::FixedTickSystem tickSystem;
    platform::FixedTickValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::FixedTickValidationStep::FPS30);

    for (int i = 0; i < 10; ++i)
    {
        valController.Update(registry, tickSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
    REQUIRE(valController.IsDeterministicMatch());
}
