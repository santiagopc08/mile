#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/graphics/camera/FollowCamera.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/gameplay/CheckpointSystem.hpp"
#include "engine/gameplay/CheckpointComponent.hpp"
#include "engine/gameplay/SpawnSystem.hpp"
#include "engine/gameplay/VehicleRecoverySystem.hpp"
#include "examples/hill_climb/GameplayValidationScene.hpp"
#include "engine/vehicle/VehicleFactory.hpp"

TEST_CASE("GameplayStateMachine Transitions", "[Gameplay]")
{
    platform::GameplayStateMachine stateMachine;
    platform::EventQueue eventQueue;

    REQUIRE(stateMachine.GetCurrentState() == platform::MatchState::Ready);

    stateMachine.TransitionTo(platform::MatchState::Playing, &eventQueue);
    REQUIRE(stateMachine.GetCurrentState() == platform::MatchState::Playing);

    stateMachine.TransitionTo(platform::MatchState::Paused, &eventQueue);
    REQUIRE(stateMachine.GetCurrentState() == platform::MatchState::Paused);

    eventQueue.ProcessEvents();
}

TEST_CASE("FollowCamera Lookahead and Smooth Tracking", "[Camera]")
{
    platform::Camera2D camera(1280.0f, 720.0f);
    camera.SetPosition({0.0f, 0.0f});

    platform::FollowCamera followCam(camera);

    // Target moving forward at x=100 with velocity vx=200
    followCam.Update({100.0f, 0.0f}, {200.0f, 0.0f}, 0.016);

    // Camera position should advance towards target + lookahead
    REQUIRE(camera.GetPosition().x > 0.0f);
}

TEST_CASE("CheckpointSystem Activation and Sequence Tracking", "[Gameplay]")
{
    platform::Registry registry;
    platform::EventQueue eventQueue;

    // Player Entity
    platform::EntityID player = registry.CreateEntity();
    auto &pTransform = registry.AddComponent<platform::TransformComponent>(player);
    pTransform.SetPosition({0.0f, 0.0f});

    // Checkpoint 1 at x=50
    platform::EntityID cp1 = registry.CreateEntity();
    auto &cpTransform = registry.AddComponent<platform::TransformComponent>(cp1);
    cpTransform.SetPosition({50.0f, 0.0f});

    auto &cpComp = registry.AddComponent<platform::CheckpointComponent>(cp1);
    cpComp.Sequence = 1;
    cpComp.Position = {50.0f, 0.0f};
    cpComp.Radius = 60.0f;

    platform::CheckpointSystem cpSystem;
    cpSystem.Update(registry, player, &eventQueue);

    // Player at (0,0) is within 60 units of CP1 at (50,0) -> CP1 activates
    REQUIRE(cpComp.Activated);
    REQUIRE(cpSystem.GetLastActivatedSequence() == 1);
    REQUIRE(cpSystem.GetLatestCheckpointPosition().x == Catch::Approx(50.0f));
}

TEST_CASE("VehicleRecoverySystem Resets Flipped Vehicle", "[Gameplay]")
{
    platform::Registry registry;
    platform::PhysicsWorld physicsWorld;
    physicsWorld.Initialize();

    platform::EntityID vehicle = platform::VehicleFactory::CreateVehicle(registry);
    auto *vTransform = registry.GetComponent<platform::TransformComponent>(vehicle);
    REQUIRE(vTransform != nullptr);

    // Flip vehicle to 150 degrees
    vTransform->SetRotation(150.0f);

    platform::GameplayStateMachine stateMachine;
    platform::VehicleRecoverySystem recoverySystem;

    recoverySystem.Update(registry, physicsWorld, vehicle, {100.0f, 0.0f}, stateMachine, nullptr);

    // Flipped vehicle should be reset to upright angle 0 at checkpoint (100, 0)
    REQUIRE(vTransform->Rotation == Catch::Approx(0.0f));
    REQUIRE(vTransform->Position.x == Catch::Approx(100.0f));
    REQUIRE(stateMachine.GetMetrics().RespawnCount == 1);

    physicsWorld.Shutdown();
}

TEST_CASE("GameplayValidationScene Full Loop Execution", "[GameplayScene]")
{
    platform::GameplayValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    scene.Update(0.016);
    REQUIRE(scene.GetStateMachine().GetCurrentState() == platform::MatchState::Playing);

    scene.Deactivate();
    scene.Shutdown();
}
