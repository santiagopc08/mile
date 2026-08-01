#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/gameplay/RecoverySettingsComponent.hpp"
#include "engine/gameplay/RecoveryRuntimeComponent.hpp"
#include "engine/gameplay/VehicleRecoverySystem.hpp"
#include "engine/gameplay/RecoveryValidationController.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS007 Vehicle Recovery Conditions & State Restoration", "[MS007]")
{
    platform::Scene scene("Test Recovery Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID vehicle = loader.instantiatePrefab(scene, prefab, {0.0f, 0.0f});
    REQUIRE(vehicle != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    auto &settings = registry.AddComponent<platform::RecoverySettingsComponent>(vehicle);
    auto &runtime = registry.AddComponent<platform::RecoveryRuntimeComponent>(vehicle);

    platform::VehicleRecoverySystem recoverySystem;
    platform::PhysicsSystem physicsSystem;
    platform::PhysicsConfig pConfig;
    physicsSystem.Initialize(pConfig);

    recoverySystem.setRecoveryTransform(runtime, {100.0f, 50.0f}, 0.0f);
    REQUIRE(runtime.spawnPosition.x == 100.0f);

    // Request recovery & execute
    recoverySystem.requestRecovery(runtime);
    REQUIRE(recoverySystem.recoveryPending(runtime));

    recoverySystem.recover(registry, physicsSystem.GetWorld(), vehicle, runtime);
    REQUIRE_FALSE(recoverySystem.recoveryPending(runtime));
    REQUIRE(recoverySystem.recoveryCount(runtime) == 1);

    physicsSystem.Shutdown();
}

TEST_CASE("GAME-001-MS007 Recovery Validation Controller Sequence Execution", "[MS007]")
{
    platform::Scene scene("Test Recovery Controller Scene");
    platform::PrefabLoader loader;
    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID vehicle = loader.instantiatePrefab(scene, prefab, {0.0f, 0.0f});

    auto &registry = scene.GetRegistry();
    registry.AddComponent<platform::RecoverySettingsComponent>(vehicle);
    registry.AddComponent<platform::RecoveryRuntimeComponent>(vehicle);

    platform::PhysicsSystem physicsSystem;
    platform::PhysicsConfig pConfig;
    physicsSystem.Initialize(pConfig);

    platform::VehicleRecoverySystem recoverySystem;
    platform::RecoveryValidationController valController;

    valController.Initialize();
    REQUIRE(valController.GetState() == platform::RecoveryValidationState::Spawn);

    // Run sequence updates
    for (int i = 0; i < 50; ++i)
    {
        valController.Update(registry, physicsSystem.GetWorld(), recoverySystem, vehicle, 0.016);
    }

    REQUIRE(valController.GetCycleCount() > 0);
    REQUIRE(valController.IsCompleted());

    physicsSystem.Shutdown();
}

TEST_CASE("GAME-001-MS007 Vehicle Recovery Scene Simulation", "[MS007]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    for (int i = 0; i < 20; ++i)
    {
        scene.Update(0.016);
    }

    scene.Shutdown();
}
