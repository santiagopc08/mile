#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/vehicle/components/SuspensionSettingsComponent.hpp"
#include "engine/vehicle/systems/SuspensionSystem.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS003 Suspension System Joint Creation & Spring Simulation", "[MS003]")
{
    platform::Scene scene("Test Suspension Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID root = loader.instantiatePrefab(scene, prefab, {0.0f, 0.0f});
    REQUIRE(root != platform::kNullEntity);

    auto &registry = scene.GetRegistry();
    auto *vehicleComp = registry.GetComponent<platform::VehicleComponent>(root);
    REQUIRE(vehicleComp != nullptr);

    // Verify SuspensionComponent and SuspensionSettingsComponent
    auto *fwSusp = registry.GetComponent<platform::SuspensionComponent>(vehicleComp->frontWheel);
    auto *fwSettings = registry.GetComponent<platform::SuspensionSettingsComponent>(vehicleComp->frontWheel);
    REQUIRE(fwSusp != nullptr);
    REQUIRE(fwSettings != nullptr);
    REQUIRE(fwSusp->enabled);
    REQUIRE(fwSettings->frequencyHz == 5.0f);
    REQUIRE(fwSettings->dampingRatio == 0.7f);

    // Initialize Physics World and Create Wheel Joints (Suspension)
    platform::PhysicsSystem physicsSystem;
    platform::PhysicsConfig pConfig;
    physicsSystem.Initialize(pConfig);

    auto *bTransform = registry.GetComponent<platform::TransformComponent>(vehicleComp->body);
    auto *bBody = registry.GetComponent<platform::RigidBodyComponent>(vehicleComp->body);
    auto *bCollider = registry.GetComponent<platform::ColliderComponent>(vehicleComp->body);
    void *bodyHandle = physicsSystem.GetWorld().CreateBody(vehicleComp->body, *bTransform, *bBody, bCollider);

    auto *fwTransform = registry.GetComponent<platform::TransformComponent>(vehicleComp->frontWheel);
    auto *fwBody = registry.GetComponent<platform::RigidBodyComponent>(vehicleComp->frontWheel);
    auto *fwCollider = registry.GetComponent<platform::ColliderComponent>(vehicleComp->frontWheel);
    void *fwHandle = physicsSystem.GetWorld().CreateBody(vehicleComp->frontWheel, *fwTransform, *fwBody, fwCollider);

    platform::SuspensionSystem suspSystem;
    void *wheelJointHandle = suspSystem.createSuspension(
        physicsSystem.GetWorld(), vehicleComp->body, vehicleComp->frontWheel,
        bodyHandle, fwHandle, {60.0f, -20.0f}, {0.0f, 1.0f}, 5.0f, 0.7f);

    REQUIRE(wheelJointHandle != nullptr);

    // Run suspension system update
    suspSystem.Update(registry, physicsSystem.GetWorld(), 0.016);
    REQUIRE(fwSusp->currentCompression() >= 0.0f);
    REQUIRE(fwSusp->isGrounded());

    // Clean teardown
    suspSystem.destroySuspension(physicsSystem.GetWorld(), wheelJointHandle);
    physicsSystem.Shutdown();
}

TEST_CASE("GAME-001-MS003 Vehicle Suspension Validation Scene Simulation", "[MS003]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    // Simulate physics step updates over uneven terrain
    for (int i = 0; i < 15; ++i)
    {
        scene.Update(0.016);
    }

    scene.Shutdown();
}
