#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/character/CharacterSystem.hpp"
#include "engine/character/movement/CharacterMovementSystem.hpp"
#include "engine/graphics/camera/PlatformCameraSettingsComponent.hpp"
#include "engine/graphics/camera/PlatformCameraRuntimeComponent.hpp"
#include "engine/graphics/camera/PlatformCameraSystem.hpp"
#include "engine/graphics/camera/PlatformCameraValidationController.hpp"

TEST_CASE("GAME-002-MS005 Platformer Camera Framework & Tracking Modes", "[MS005]")
{
    platform::Scene scene("Test Platform Camera Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::PlatformCameraSystem camSystem;

    platform::EntityID player = charSystem.spawnCharacter(registry, 1, platform::CharacterType::Player, {10.0f, 5.0f});
    platform::EntityID camera = registry.CreateEntity("Camera");

    registry.AddComponent<platform::TransformComponent>(camera);
    camSystem.setTarget(registry, camera, player);

    REQUIRE(camSystem.cameraMode(registry, camera) == platform::PlatformCameraMode::PredictiveFollow);

    camSystem.Update(registry, 0.016);
    auto targetPos = camSystem.targetPosition(registry, camera);
    REQUIRE(targetPos.x > 0.0f);

    platform::CameraView view = camSystem.generateCameraView(registry, camera);
    REQUIRE(view.Viewport.z == 1280.0f);

    // Profiler metrics check (POLICY-006)
    auto metrics = camSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS005 Platformer Camera Validation Controller Autonomous Sequence", "[MS005]")
{
    platform::Scene scene("Test Platform Camera Validation Scene");
    auto &registry = scene.GetRegistry();

    platform::CharacterSystem charSystem;
    platform::CharacterMovementSystem moveSystem;
    platform::PlatformCameraSystem camSystem;
    platform::PlatformCameraValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::PlatformCamValidationStep::Walk);

    // Run updates to cycle through autonomous camera validation sequence
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, charSystem, moveSystem, camSystem, 0.016);
        camSystem.Update(registry, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());
}
