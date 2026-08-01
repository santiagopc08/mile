#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/graphics/camera/CameraFollowSettingsComponent.hpp"
#include "engine/graphics/camera/CameraFollowRuntimeComponent.hpp"
#include "engine/graphics/camera/CameraFollowSystem.hpp"
#include "engine/graphics/camera/CameraValidationController.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS006 Camera Follow System Modes & Constraints", "[MS006]")
{
    platform::Scene scene("Test Camera Follow Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID target = loader.instantiatePrefab(scene, prefab, {100.0f, 50.0f});
    REQUIRE(target != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    platform::EntityID camEntity = registry.CreateEntity("TestCamera");
    auto &settings = registry.AddComponent<platform::CameraFollowSettingsComponent>(camEntity);
    auto &runtime = registry.AddComponent<platform::CameraFollowRuntimeComponent>(camEntity);

    platform::CameraFollowSystem followSystem;
    followSystem.setTarget(settings, target);
    followSystem.setOffset(settings, {0.0f, -10.0f});
    followSystem.setConstraints(settings, {-500.0f, 500.0f, -500.0f, 500.0f});
    followSystem.setDeadZone(settings, {10.0f, 10.0f});

    platform::Camera2D camera(1280.0f, 720.0f);

    // Instant Snap Mode in Ready State
    followSystem.Update(registry, camera, platform::MatchState::Ready, 0.016);
    REQUIRE(camera.GetPosition().x == 100.0f);
    REQUIRE(camera.GetPosition().y == 40.0f);

    // Smooth Follow Mode in Playing State
    settings.mode = platform::CameraFollowMode::SmoothFollow;
    followSystem.Update(registry, camera, platform::MatchState::Playing, 0.016);
    REQUIRE(followSystem.currentPosition(runtime).x > 0.0f);

    // Paused State Freezes Camera
    glm::vec2 posBefore = camera.GetPosition();
    followSystem.Update(registry, camera, platform::MatchState::Paused, 0.016);
    REQUIRE(camera.GetPosition() == posBefore);
}

TEST_CASE("GAME-001-MS006 Camera Validation Controller Sequence Execution", "[MS006]")
{
    platform::GameplayStateMachine stateMachine;
    platform::VehicleControllerRuntimeComponent cRuntime;
    platform::VehicleControllerSystem vcSystem;
    platform::CameraValidationController cameraValController;

    cameraValController.Initialize();
    REQUIRE(cameraValController.GetState() == platform::CameraValidationSequenceState::SpawnVehicle);

    // Run updates to cycle through autonomous camera validation sequence
    for (int i = 0; i < 120; ++i)
    {
        cameraValController.Update(stateMachine, cRuntime, vcSystem, 0.016);
    }

    REQUIRE(cameraValController.GetCycleCount() > 0);
    REQUIRE(cameraValController.IsCompleted());
}

TEST_CASE("GAME-001-MS006 Vehicle Camera Validation Scene Autonomous Simulation", "[MS006]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    // Simulate physics step updates driven autonomously by camera controller
    for (int i = 0; i < 30; ++i)
    {
        scene.Update(0.016);
    }

    scene.Shutdown();
}
