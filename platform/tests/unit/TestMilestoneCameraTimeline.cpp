#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/graphics/camera/CameraTimelineSettingsComponent.hpp"
#include "engine/graphics/camera/CameraTimelineRuntimeComponent.hpp"
#include "engine/graphics/camera/CameraTimelineSystem.hpp"
#include "engine/graphics/camera/CameraTimelineValidationController.hpp"

TEST_CASE("GAME-003-MS005 Camera Timeline Framework Interpolation & Tracks", "[MS005]")
{
    platform::Scene scene("Test Camera Timeline Scene");
    auto &registry = scene.GetRegistry();

    platform::CameraTimelineSystem camSystem;
    platform::EntityID camEntity = registry.CreateEntity("CameraTimelineEntity");

    auto *settings = registry.GetComponent<platform::CameraTimelineSettingsComponent>(camEntity);
    if (!settings) settings = &registry.AddComponent<platform::CameraTimelineSettingsComponent>(camEntity);

    settings->keyframes = {
        { 0.0, {0.0f, 0.0f}, 1.0f, 0.0f, 0.0f, platform::CameraInterpolation::Linear },
        { 1.0, {10.0f, 20.0f}, 2.0f, 0.0f, 0.0f, platform::CameraInterpolation::Linear }
    };
    settings->duration = 1.0;

    camSystem.playCameraTimeline(registry, camEntity);
    REQUIRE(camSystem.cameraTimelineState(registry, camEntity) == platform::CameraTimelineState::Playing);

    camSystem.Update(registry, 0.5);

    auto *runtime = registry.GetComponent<platform::CameraTimelineRuntimeComponent>(camEntity);
    REQUIRE(runtime != nullptr);
    REQUIRE(runtime->currentView.Transform.x == 5.0f);
    REQUIRE(runtime->currentView.Transform.y == 10.0f);
    REQUIRE(runtime->currentView.Viewport.z == 1280.0f / 1.5f);

    // Profiler metrics check (POLICY-006)
    auto metrics = camSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Driven");
}

TEST_CASE("GAME-003-MS005 Camera Timeline Framework Autonomous Validation Sequence", "[MS005]")
{
    platform::Scene scene("Test Camera Timeline Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::CameraTimelineSystem camSystem;
    platform::CameraTimelineValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::CameraTimelineValidationStep::MoveCamera);

    for (int i = 0; i < 20; ++i)
    {
        valController.Update(registry, camSystem, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
