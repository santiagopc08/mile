#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/vehicle/components/WheelJointComponent.hpp"
#include "engine/vehicle/components/WheelAssemblyComponent.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS002 Wheel Assembly Joint Creation & Physical Connection", "[MS002]")
{
    platform::Scene scene("Test Wheel Assembly Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    platform::EntityID root = loader.instantiatePrefab(scene, prefab, {0.0f, 0.0f});
    REQUIRE(root != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    // Verify Root VehicleComponent
    auto *vehicleComp = registry.GetComponent<platform::VehicleComponent>(root);
    REQUIRE(vehicleComp != nullptr);

    // Verify WheelJointComponent and WheelAssemblyComponent on Front Wheel
    auto *fwJointComp = registry.GetComponent<platform::WheelJointComponent>(vehicleComp->frontWheel);
    auto *fwAssemblyComp = registry.GetComponent<platform::WheelAssemblyComponent>(vehicleComp->frontWheel);
    REQUIRE(fwJointComp != nullptr);
    REQUIRE(fwAssemblyComp != nullptr);
    REQUIRE(fwJointComp->body == vehicleComp->body);
    REQUIRE(fwJointComp->wheel == vehicleComp->frontWheel);
    REQUIRE(fwJointComp->enabled);

    // Verify WheelJointComponent and WheelAssemblyComponent on Rear Wheel
    auto *rwJointComp = registry.GetComponent<platform::WheelJointComponent>(vehicleComp->rearWheel);
    auto *rwAssemblyComp = registry.GetComponent<platform::WheelAssemblyComponent>(vehicleComp->rearWheel);
    REQUIRE(rwJointComp != nullptr);
    REQUIRE(rwAssemblyComp != nullptr);
    REQUIRE(rwJointComp->body == vehicleComp->body);
    REQUIRE(rwJointComp->wheel == vehicleComp->rearWheel);
    REQUIRE(rwJointComp->enabled);

    // Initialize Physics World and Create Revolute Joints
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

    void *jointHandle = physicsSystem.GetWorld().CreateRevoluteJoint(bodyHandle, fwHandle, fwJointComp->anchor);
    REQUIRE(jointHandle != nullptr);

    // Clean teardown
    physicsSystem.GetWorld().DestroyJoint(jointHandle);
    physicsSystem.Shutdown();
}

TEST_CASE("GAME-001-MS002 Wheel Assembly Validation Scene Simulation", "[MS002]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);

    // Simulate physics step updates (Vehicle falls under gravity as single assembly)
    for (int i = 0; i < 10; ++i)
    {
        scene.Update(0.016);
    }

    scene.Shutdown();
}
