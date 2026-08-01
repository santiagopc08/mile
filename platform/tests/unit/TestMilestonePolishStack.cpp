#include <catch2/catch_test_macros.hpp>

#include "engine/presentation/GameplayHUDViewModel2D.hpp"
#include "engine/presentation/PresentationValidationController2D.hpp"
#include "engine/audio/PlatformerAudioValidationController.hpp"
#include "engine/graphics/vfx/PlatformerVFXValidationController.hpp"
#include "engine/diagnostics/PlatformerPerformanceProfiler.hpp"

TEST_CASE("GAME-002-MS027 Presentation Framework & ViewModel Integration", "[MS027]")
{
    platform::GameplayHUDViewModel2D viewModel;
    platform::PresentationValidationController2D presController;

    presController.Initialize();
    REQUIRE(presController.GetState() == platform::Presentation2DStep::Gameplay);

    for (int i = 0; i < 50; ++i)
    {
        presController.Update(viewModel, 0.016);
    }

    REQUIRE(presController.GetCycleCount() > 0);
    REQUIRE(presController.IsCompleted());
}

TEST_CASE("GAME-002-MS028 Audio & Music Event Driven Soundscape", "[MS028]")
{
    platform::PlatformerAudioValidationController audioController;

    audioController.triggerAllSoundEvents();
    REQUIRE(audioController.triggeredSoundCount() == 12);

    audioController.triggerAllMusicTracks();
    REQUIRE(audioController.triggeredMusicCount() == 5);
}

TEST_CASE("GAME-002-MS029 Visual Effects Framework Triggering", "[MS029]")
{
    platform::PlatformerVFXValidationController vfxController;

    vfxController.triggerAllVFXEvents();
    REQUIRE(vfxController.triggeredVFXCount() == 10);
}

TEST_CASE("GAME-002-MS030 Performance Optimization & Benchmarking", "[MS030]")
{
    platform::PlatformerPerformanceProfiler profiler;
    platform::PlatformerPerformanceReport report = profiler.MeasurePerformance();

    REQUIRE(report.passesBudgets);
    REQUIRE(report.cpuTimeMs < 3.0);
    REQUIRE(report.targetFPS == 120.0);

    // Profiler metrics check (POLICY-006)
    auto metrics = profiler.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Optimized");
}
