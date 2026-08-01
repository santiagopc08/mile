#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/rhythm/RhythmSettingsComponent.hpp"
#include "engine/rhythm/RhythmRuntimeComponent.hpp"
#include "engine/rhythm/RhythmSystem.hpp"
#include "engine/rhythm/RhythmValidationController.hpp"

TEST_CASE("GAME-003-MS002 Rhythm Framework Operations & Timing", "[MS002]")
{
    platform::Scene scene("Test Rhythm Scene");
    auto &registry = scene.GetRegistry();

    platform::RhythmSystem rhythmSystem;
    platform::EntityID rhythmEntity = registry.CreateEntity("RhythmController");

    rhythmSystem.setBPM(registry, rhythmEntity, 120.0f); // 120 BPM = 0.5s per beat
    rhythmSystem.play(registry, rhythmEntity);

    REQUIRE(rhythmSystem.currentBeat(registry, rhythmEntity) == 0);
    REQUIRE(rhythmSystem.currentMeasure(registry, rhythmEntity) == 1);

    // Update 1.0s -> 2 beats
    rhythmSystem.Update(registry, 1.0);
    REQUIRE(rhythmSystem.currentBeat(registry, rhythmEntity) == 2);
    REQUIRE(rhythmSystem.songTime(registry, rhythmEntity) == 1.0);

    // Seek to beat 16 (measure 5)
    rhythmSystem.seekBeat(registry, rhythmEntity, 16);
    REQUIRE(rhythmSystem.currentBeat(registry, rhythmEntity) == 16);
    REQUIRE(rhythmSystem.currentMeasure(registry, rhythmEntity) == 5);
    REQUIRE(rhythmSystem.songTime(registry, rhythmEntity) == 8.0); // 16 * 0.5s = 8.0s

    // Profiler metrics check (POLICY-006)
    auto metrics = rhythmSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Synchronized");
}

TEST_CASE("GAME-003-MS002 Rhythm Framework Autonomous Validation Sequence", "[MS002]")
{
    platform::Scene scene("Test Rhythm Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::RhythmSystem rhythmSystem;
    platform::RhythmValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::RhythmValidationStep::StartSong);

    for (int i = 0; i < 20; ++i)
    {
        valController.Update(registry, rhythmSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
    REQUIRE(valController.AccumulatedDrift() == 0.0);
}
