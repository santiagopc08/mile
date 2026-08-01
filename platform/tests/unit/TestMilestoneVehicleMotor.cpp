#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/MotorSettingsComponent.hpp"
#include "engine/vehicle/components/MotorRuntimeComponent.hpp"
#include "engine/vehicle/components/VehicleMotorComponent.hpp"
#include "engine/vehicle/systems/MotorSystem.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS004 Motor Framework & Drive Modes", "[MS004]")
{
    platform::Scene scene("Test Motor Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID root = loader.instantiatePrefab(scene, prefab, {0.0f, 0.0f});
    REQUIRE(root != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    // Verify Config & Runtime Component Separation
    auto *settings = registry.GetComponent<platform::MotorSettingsComponent>(root);
    auto *runtime = registry.GetComponent<platform::MotorRuntimeComponent>(root);
    auto *motor = registry.GetComponent<platform::VehicleMotorComponent>(root);

    REQUIRE(settings != nullptr);
    REQUIRE(runtime != nullptr);
    REQUIRE(motor != nullptr);
    REQUIRE(settings->maxTorque == 600.0f);
    REQUIRE(runtime->enabled);

    platform::MotorSystem motorSystem;

    // Test Drive Modes
    motorSystem.setDriveMode(*settings, platform::DriveMode::FWD);
    REQUIRE(motorSystem.driveMode(*settings) == platform::DriveMode::FWD);
    REQUIRE(settings->frontWheelDrive);
    REQUIRE_FALSE(settings->rearWheelDrive);

    motorSystem.setDriveMode(*settings, platform::DriveMode::RWD);
    REQUIRE(motorSystem.driveMode(*settings) == platform::DriveMode::RWD);
    REQUIRE_FALSE(settings->frontWheelDrive);
    REQUIRE(settings->rearWheelDrive);

    motorSystem.setDriveMode(*settings, platform::DriveMode::AWD);
    REQUIRE(motorSystem.driveMode(*settings) == platform::DriveMode::AWD);
    REQUIRE(settings->frontWheelDrive);
    REQUIRE(settings->rearWheelDrive);

    // Test Target Speed Ramp & System Update
    platform::PhysicsSystem physicsSystem;
    platform::PhysicsConfig pConfig;
    physicsSystem.Initialize(pConfig);

    motorSystem.setTargetSpeed(*runtime, 800.0f);
    motorSystem.Update(registry, physicsSystem.GetWorld(), 0.016);

    REQUIRE(runtime->appliedSpeed > 0.0f);
    REQUIRE(motorSystem.currentSpeed(*runtime) > 0.0f);
    REQUIRE(motorSystem.currentTorque(*runtime) == 600.0f);

    // Test Motor Reverse & Stop
    motorSystem.setTargetSpeed(*runtime, -400.0f);
    motorSystem.Update(registry, physicsSystem.GetWorld(), 0.016);

    motorSystem.stop(*runtime);
    REQUIRE(runtime->targetSpeed == 0.0f);

    physicsSystem.Shutdown();
}

TEST_CASE("GAME-001-MS004 Vehicle Motor Validation Scene Simulation", "[MS004]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    // Simulate physics step updates with active motor driving vehicle
    for (int i = 0; i < 20; ++i)
    {
        scene.Update(0.016);
    }

    scene.Shutdown();
}
