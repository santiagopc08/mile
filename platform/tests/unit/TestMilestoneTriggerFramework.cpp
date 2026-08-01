#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/trigger/TriggerSettingsComponent.hpp"
#include "engine/trigger/TriggerRuntimeComponent.hpp"
#include "engine/trigger/TriggerSystem.hpp"
#include "engine/trigger/TriggerValidationController.hpp"

TEST_CASE("GAME-003-MS004 Trigger Framework Firing & Conditions", "[MS004]")
{
    platform::Scene scene("Test Trigger Scene");
    auto &registry = scene.GetRegistry();

    platform::TriggerSystem triggerSystem;
    platform::EntityID triggerEntity = registry.CreateEntity("Trigger_1");

    triggerSystem.registerTrigger(registry, triggerEntity, 1, platform::TriggerCondition::Once, platform::TriggerAction::PublishRuntimeEvent);

    REQUIRE(triggerSystem.triggerState(registry, triggerEntity) == platform::TriggerState::Ready);
    REQUIRE(triggerSystem.triggerCount(registry) == 1);

    // Fire once
    REQUIRE(triggerSystem.fire(registry, triggerEntity, 10));
    REQUIRE(triggerSystem.executedTriggers(registry, triggerEntity) == 1);
    REQUIRE(triggerSystem.lastExecutionTick(registry, triggerEntity) == 10);
    REQUIRE(triggerSystem.triggerState(registry, triggerEntity) == platform::TriggerState::Completed);

    // Second fire should fail because condition is Once
    REQUIRE_FALSE(triggerSystem.fire(registry, triggerEntity, 20));
    REQUIRE(triggerSystem.executedTriggers(registry, triggerEntity) == 1);

    // Profiler metrics check (POLICY-006)
    auto metrics = triggerSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-003-MS004 Trigger Framework Autonomous Validation Sequence", "[MS004]")
{
    platform::Scene scene("Test Trigger Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::TriggerSystem triggerSystem;
    platform::TriggerValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::TriggerValidationStep::LoadTimeline);

    for (int i = 0; i < 20; ++i)
    {
        valController.Update(registry, triggerSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
