#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/graphics/components/SpriteComponent.hpp"
#include "engine/scene/components/RelationshipComponent.hpp"
#include "examples/hill_climb/VehicleValidationScene.hpp"

TEST_CASE("GAME-001-MS001 Vehicle Prefab Loading & Entity Hierarchy Composition", "[MS001]")
{
    platform::Scene scene("Test Vehicle Scene");
    platform::PrefabLoader loader;

    auto prefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
    REQUIRE(prefab.Name == "VehiclePrefab");
    REQUIRE(prefab.RootEntity.Name == "VehicleRoot");
    REQUIRE(prefab.RootEntity.Children.size() == 3);

    platform::EntityID root = loader.instantiatePrefab(scene, prefab, {10.0f, 20.0f});
    REQUIRE(root != platform::kNullEntity);

    auto &registry = scene.GetRegistry();

    // Verify Root VehicleComponent
    auto *vehicleComp = registry.GetComponent<platform::VehicleComponent>(root);
    REQUIRE(vehicleComp != nullptr);
    REQUIRE(vehicleComp->active);
    REQUIRE(vehicleComp->body != platform::kNullEntity);
    REQUIRE(vehicleComp->frontWheel != platform::kNullEntity);
    REQUIRE(vehicleComp->rearWheel != platform::kNullEntity);

    // Verify Hierarchy
    auto *rootRel = registry.GetComponent<platform::RelationshipComponent>(root);
    REQUIRE(rootRel != nullptr);
    REQUIRE(rootRel->ChildrenCount == 3);
    REQUIRE(rootRel->FirstChild != platform::kNullEntity);

    // Verify Body Entity
    auto *bodyRB = registry.GetComponent<platform::RigidBodyComponent>(vehicleComp->body);
    auto *bodyCollider = registry.GetComponent<platform::ColliderComponent>(vehicleComp->body);
    auto *bodySprite = registry.GetComponent<platform::SpriteComponent>(vehicleComp->body);
    REQUIRE(bodyRB != nullptr);
    REQUIRE(bodyCollider != nullptr);
    REQUIRE(bodySprite != nullptr);
    REQUIRE(bodyRB->Type == platform::BodyType::Dynamic);

    // Verify Front Wheel Entity
    auto *fwWheel = registry.GetComponent<platform::WheelComponent>(vehicleComp->frontWheel);
    auto *fwRB = registry.GetComponent<platform::RigidBodyComponent>(vehicleComp->frontWheel);
    auto *fwCollider = registry.GetComponent<platform::ColliderComponent>(vehicleComp->frontWheel);
    REQUIRE(fwWheel != nullptr);
    REQUIRE(fwRB != nullptr);
    REQUIRE(fwCollider != nullptr);
    REQUIRE(fwWheel->radius == 18.0f);
    REQUIRE(fwWheel->powered);

    // Verify Rear Wheel Entity
    auto *rwWheel = registry.GetComponent<platform::WheelComponent>(vehicleComp->rearWheel);
    auto *rwRB = registry.GetComponent<platform::RigidBodyComponent>(vehicleComp->rearWheel);
    auto *rwCollider = registry.GetComponent<platform::ColliderComponent>(vehicleComp->rearWheel);
    REQUIRE(rwWheel != nullptr);
    REQUIRE(rwRB != nullptr);
    REQUIRE(rwCollider != nullptr);

    // Destroy Prefab
    loader.destroyPrefab(scene, root);
    REQUIRE(registry.EntityCount() == 0);
}

TEST_CASE("GAME-001-MS001 Vehicle Validation Scene Execution", "[MS001]")
{
    platform::VehicleValidationScene scene;
    scene.Initialize();

    REQUIRE(scene.GetVehicleEntity() != platform::kNullEntity);
    REQUIRE(scene.GetGroundEntity() != platform::kNullEntity);

    scene.Update(0.016);
    scene.Shutdown();
}
