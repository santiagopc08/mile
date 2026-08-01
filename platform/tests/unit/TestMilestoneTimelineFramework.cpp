#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/timeline/TimelineSettingsComponent.hpp"
#include "engine/timeline/TimelineRuntimeComponent.hpp"
#include "engine/timeline/TimelineSystem.hpp"
#include "engine/timeline/TimelineValidationController.hpp"

TEST_CASE("GAME-003-MS003 Timeline Framework Execution & Priority Sorting", "[MS003]")
{
    platform::Scene scene("Test Timeline Scene");
    auto &registry = scene.GetRegistry();

    platform::TimelineSystem timelineSystem;
    platform::EntityID timelineEntity = registry.CreateEntity("TimelineController");

    std::vector<platform::TimelineEventData> events = {
        { 1, 0.5, 10, "First" },
        { 2, 0.5, 50, "HighestPrioritySimultaneous" },
        { 3, 1.0, 5,  "Last" }
    };

    timelineSystem.loadTimeline(registry, timelineEntity, events, 2.0);
    timelineSystem.play(registry, timelineEntity);

    std::vector<uint32_t> executedIDs;
    timelineSystem.Update(registry, 0.6, [&executedIDs](const platform::TimelineEventData &evt) {
        executedIDs.push_back(evt.eventID);
    });

    REQUIRE(executedIDs.size() == 2);
    REQUIRE(executedIDs[0] == 2); // Priority 50 executed before Priority 10 at time 0.5s
    REQUIRE(executedIDs[1] == 1);

    timelineSystem.Update(registry, 0.5, [&executedIDs](const platform::TimelineEventData &evt) {
        executedIDs.push_back(evt.eventID);
    });

    REQUIRE(executedIDs.size() == 3);
    REQUIRE(executedIDs[2] == 3);

    // Profiler metrics check (POLICY-006)
    auto metrics = timelineSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Running");
}

TEST_CASE("GAME-003-MS003 Timeline Framework Autonomous Validation Sequence", "[MS003]")
{
    platform::Scene scene("Test Timeline Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::TimelineSystem timelineSystem;
    platform::TimelineValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::TimelineValidationStep::LoadTimeline);

    for (int i = 0; i < 20; ++i)
    {
        valController.Update(registry, timelineSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
    REQUIRE(valController.IsEventOrderingDeterministic());
}
