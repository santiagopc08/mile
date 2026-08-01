#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/VehicleControllerSettingsComponent.hpp"
#include "engine/vehicle/components/VehicleControllerRuntimeComponent.hpp"
#include "engine/vehicle/components/MotorSettingsComponent.hpp"
#include "engine/vehicle/components/MotorRuntimeComponent.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"
#include "engine/vehicle/controllers/VehicleControllerValidationController.hpp"
#include "engine/vehicle/systems/MotorSystem.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS005 Vehicle Controller Normalized Commands & Motor Propagation", "[MS005]")
{
    platform::Scene scene("Test Vehicle Controller Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID root = loader.instantiatePrefab(scene, prefab, {0.0f, 0.0f});
    REQUIRE(root != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    auto *cSettings = registry.GetComponent<platform::VehicleControllerSettingsComponent>(root);
    auto *cRuntime = registry.GetComponent<platform::VehicleControllerRuntimeComponent>(root);
    auto *mSettings = registry.GetComponent<platform::MotorSettingsComponent>(root);
    auto *mRuntime = registry.GetComponent<platform::MotorRuntimeComponent>(root);

    REQUIRE(cSettings != nullptr);
    REQUIRE(cRuntime != nullptr);
    REQUIRE(mSettings != nullptr);
    REQUIRE(mRuntime != nullptr);

    platform::VehicleControllerSystem vcSystem;
    platform::MotorSystem motorSystem;
    platform::PhysicsSystem physicsSystem;
    platform::PhysicsConfig pConfig;
    physicsSystem.Initialize(pConfig);

    // Test Normalized Command Setters
    vcSystem.setThrottle(*cRuntime, 1.5f); // Clamped to 1.0f
    REQUIRE(cRuntime->throttle == 1.0f);

    vcSystem.setSteering(*cRuntime, -2.0f); // Clamped to -1.0f
    REQUIRE(cRuntime->steering == -1.0f);

    vcSystem.setBrake(*cRuntime, 0.5f);
    REQUIRE(cRuntime->brake == 0.5f);

    vcSystem.setReverse(*cRuntime, true);
    REQUIRE(cRuntime->reverse);

    // Test VehicleControllerSystem Update -> Motor targetSpeed propagation
    vcSystem.Update(registry, 0.016);
    REQUIRE(mRuntime->targetSpeed < 0.0f); // Reverse speed

    // Test Controller Reset
    vcSystem.reset(*cRuntime);
    REQUIRE(cRuntime->throttle == 0.0f);
    REQUIRE(cRuntime->steering == 0.0f);
    REQUIRE(cRuntime->brake == 0.0f);
    REQUIRE_FALSE(cRuntime->reverse);

    physicsSystem.Shutdown();
}

TEST_CASE("GAME-001-MS005 Autonomous Validation Controller Sequence Execution", "[MS005]")
{
    platform::VehicleControllerRuntimeComponent runtime;
    platform::VehicleControllerSystem vcSystem;
    platform::VehicleControllerValidationController validationController;

    validationController.Initialize();
    REQUIRE(validationController.GetState() == platform::AutonomousValidationState::Idle);

    // Run updates to cycle through autonomous validation sequence
    for (int i = 0; i < 100; ++i)
    {
        validationController.Update(runtime, vcSystem, 0.016);
    }

    REQUIRE(validationController.GetCycleCount() > 0);
    REQUIRE(validationController.IsCompleted());
}

TEST_CASE("GAME-001-MS005 Vehicle Controller Validation Scene Autonomous Simulation", "[MS005]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    // Simulate physics step updates driven autonomously
    for (int i = 0; i < 25; ++i)
    {
        scene.Update(0.016);
    }

    scene.Shutdown();
}
