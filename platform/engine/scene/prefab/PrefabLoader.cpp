#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/vehicle/components/WheelJointComponent.hpp"
#include "engine/vehicle/components/WheelAssemblyComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/vehicle/components/SuspensionSettingsComponent.hpp"
#include "engine/vehicle/components/MotorSettingsComponent.hpp"
#include "engine/vehicle/components/MotorRuntimeComponent.hpp"
#include "engine/vehicle/components/VehicleMotorComponent.hpp"
#include "engine/vehicle/components/VehicleControllerSettingsComponent.hpp"
#include "engine/vehicle/components/VehicleControllerRuntimeComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/graphics/components/SpriteComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/RelationshipComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    PrefabData PrefabLoader::loadPrefab(const std::string &path)
    {
        PrefabData prefab;
        prefab.ID = 0x56454849434C4531; // "VEHICLE1"
        prefab.Name = "VehiclePrefab";

        // Root
        prefab.RootEntity.Name = "VehicleRoot";
        prefab.RootEntity.Position = {0.0f, 0.0f};

        // Body
        PrefabEntityData bodyData;
        bodyData.Name = "Body";
        bodyData.Position = {0.0f, 0.0f};
        bodyData.HasSprite = true;
        bodyData.TexturePath = "Assets/Sprites/vehicle_body.png";
        prefab.RootEntity.Children.push_back(bodyData);

        // Front Wheel
        PrefabEntityData frontWheelData;
        frontWheelData.Name = "FrontWheel";
        frontWheelData.Position = {60.0f, -20.0f};
        frontWheelData.HasSprite = true;
        frontWheelData.TexturePath = "Assets/Sprites/wheel.png";
        prefab.RootEntity.Children.push_back(frontWheelData);

        // Rear Wheel
        PrefabEntityData rearWheelData;
        rearWheelData.Name = "RearWheel";
        rearWheelData.Position = {-60.0f, -20.0f};
        rearWheelData.HasSprite = true;
        rearWheelData.TexturePath = "Assets/Sprites/wheel.png";
        prefab.RootEntity.Children.push_back(rearWheelData);

        LOG_INFO("[PrefabLoader] Loaded prefab from '{}' with root '{}'.", path, prefab.RootEntity.Name);
        return prefab;
    }

    EntityID PrefabLoader::instantiatePrefab(Scene &scene, const PrefabData &prefab, const glm::vec2 &position)
    {
        auto &registry = scene.GetRegistry();

        // 1. Create Root Entity
        EntityID root = registry.CreateEntity(prefab.RootEntity.Name);
        auto &rootTransform = registry.GetComponent<TransformComponent>(root) ? *registry.GetComponent<TransformComponent>(root) : registry.AddComponent<TransformComponent>(root);
        rootTransform.SetPosition(position);

        auto &vehicleComp = registry.AddComponent<VehicleComponent>(root);
        vehicleComp.active = true;

        // 2. Create Body Entity
        EntityID body = registry.CreateEntity("Body");
        auto &bodyTransform = registry.AddComponent<TransformComponent>(body);
        bodyTransform.SetPosition(position + glm::vec2{0.0f, 0.0f});

        auto &bodyBody = registry.AddComponent<RigidBodyComponent>(body);
        bodyBody.Type = BodyType::Dynamic;
        bodyBody.Mass = 800.0f;

        auto &bodyCollider = registry.AddComponent<ColliderComponent>(body);
        bodyCollider.Shape = ColliderShape::Rectangle;
        bodyCollider.Size = {120.0f, 40.0f};

        auto &bodySprite = registry.AddComponent<SpriteComponent>(body);
        bodySprite.SourceRectangle = {0.0f, 0.0f, 120.0f, 40.0f};

        registry.AddComponent<RenderLayerComponent>(body);
        registry.AddComponent<VisibilityComponent>(body);

        // 3. Create Front Wheel Entity
        EntityID frontWheel = registry.CreateEntity("FrontWheel");
        auto &fwTransform = registry.AddComponent<TransformComponent>(frontWheel);
        fwTransform.SetPosition(position + glm::vec2{60.0f, -20.0f});

        auto &fwBody = registry.AddComponent<RigidBodyComponent>(frontWheel);
        fwBody.Type = BodyType::Dynamic;
        fwBody.Mass = 15.0f;

        auto &fwCollider = registry.AddComponent<ColliderComponent>(frontWheel);
        fwCollider.Shape = ColliderShape::Circle;
        fwCollider.Radius = 18.0f;

        auto &fwSprite = registry.AddComponent<SpriteComponent>(frontWheel);
        fwSprite.SourceRectangle = {0.0f, 0.0f, 36.0f, 36.0f};

        auto &fwWheel = registry.AddComponent<WheelComponent>(frontWheel);
        fwWheel.radius = 18.0f;
        fwWheel.powered = true;

        auto &fwJointComp = registry.AddComponent<WheelJointComponent>(frontWheel);
        fwJointComp.body = body;
        fwJointComp.wheel = frontWheel;
        fwJointComp.anchor = position + glm::vec2{60.0f, -20.0f};
        fwJointComp.enabled = true;

        auto &fwAssemblyComp = registry.AddComponent<WheelAssemblyComponent>(frontWheel);
        fwAssemblyComp.body = body;
        fwAssemblyComp.wheel = frontWheel;
        fwAssemblyComp.joint = frontWheel;

        auto &fwSuspComp = registry.AddComponent<SuspensionComponent>(frontWheel);
        fwSuspComp.body = body;
        fwSuspComp.wheel = frontWheel;
        fwSuspComp.restLength = 30.0f;
        fwSuspComp.stiffness = 150.0f;
        fwSuspComp.damping = 15.0f;
        fwSuspComp.axis = {0.0f, 1.0f};
        fwSuspComp.enabled = true;

        registry.AddComponent<SuspensionSettingsComponent>(frontWheel);

        registry.AddComponent<RenderLayerComponent>(frontWheel);
        registry.AddComponent<VisibilityComponent>(frontWheel);

        // 4. Create Rear Wheel Entity
        EntityID rearWheel = registry.CreateEntity("RearWheel");
        auto &rwTransform = registry.AddComponent<TransformComponent>(rearWheel);
        rwTransform.SetPosition(position + glm::vec2{-60.0f, -20.0f});

        auto &rwBody = registry.AddComponent<RigidBodyComponent>(rearWheel);
        rwBody.Type = BodyType::Dynamic;
        rwBody.Mass = 15.0f;

        auto &rwCollider = registry.AddComponent<ColliderComponent>(rearWheel);
        rwCollider.Shape = ColliderShape::Circle;
        rwCollider.Radius = 18.0f;

        auto &rwSprite = registry.AddComponent<SpriteComponent>(rearWheel);
        rwSprite.SourceRectangle = {0.0f, 0.0f, 36.0f, 36.0f};

        auto &rwWheel = registry.AddComponent<WheelComponent>(rearWheel);
        rwWheel.radius = 18.0f;
        rwWheel.powered = true;

        auto &rwJointComp = registry.AddComponent<WheelJointComponent>(rearWheel);
        rwJointComp.body = body;
        rwJointComp.wheel = rearWheel;
        rwJointComp.anchor = position + glm::vec2{-60.0f, -20.0f};
        rwJointComp.enabled = true;

        auto &rwAssemblyComp = registry.AddComponent<WheelAssemblyComponent>(rearWheel);
        rwAssemblyComp.body = body;
        rwAssemblyComp.wheel = rearWheel;
        rwAssemblyComp.joint = rearWheel;

        auto &rwSuspComp = registry.AddComponent<SuspensionComponent>(rearWheel);
        rwSuspComp.body = body;
        rwSuspComp.wheel = rearWheel;
        rwSuspComp.restLength = 30.0f;
        rwSuspComp.stiffness = 150.0f;
        rwSuspComp.damping = 15.0f;
        rwSuspComp.axis = {0.0f, 1.0f};
        rwSuspComp.enabled = true;

        registry.AddComponent<SuspensionSettingsComponent>(rearWheel);

        registry.AddComponent<RenderLayerComponent>(rearWheel);
        registry.AddComponent<VisibilityComponent>(rearWheel);

        // 5. Establish Hierarchy Relationships
        auto &rootRel = registry.AddComponent<RelationshipComponent>(root);
        rootRel.FirstChild = body;
        rootRel.ChildrenCount = 3;

        auto &bodyRel = registry.AddComponent<RelationshipComponent>(body);
        bodyRel.Parent = root;
        bodyRel.NextSibling = frontWheel;

        auto &fwRel = registry.AddComponent<RelationshipComponent>(frontWheel);
        fwRel.Parent = root;
        fwRel.PrevSibling = body;
        fwRel.NextSibling = rearWheel;

        auto &rwRel = registry.AddComponent<RelationshipComponent>(rearWheel);
        rwRel.Parent = root;
        rwRel.PrevSibling = frontWheel;

        // 6. Link VehicleComponent References
        vehicleComp.body = body;
        vehicleComp.frontWheel = frontWheel;
        vehicleComp.rearWheel = rearWheel;
        vehicleComp.WheelEntities = {frontWheel, rearWheel};

        // 7. Attach Motor Components to Vehicle Root (GAME-001-MS004)
        registry.AddComponent<MotorSettingsComponent>(root);
        registry.AddComponent<MotorRuntimeComponent>(root);

        auto &vehicleMotorComp = registry.AddComponent<VehicleMotorComponent>(root);
        vehicleMotorComp.frontWheel = frontWheel;
        vehicleMotorComp.rearWheel = rearWheel;

        // 8. Attach VehicleController Components to Vehicle Root (GAME-001-MS005)
        registry.AddComponent<VehicleControllerSettingsComponent>(root);
        registry.AddComponent<VehicleControllerRuntimeComponent>(root);

        LOG_INFO("[PrefabLoader] Instantiated vehicle prefab with Controller, Motor & Suspension (Root: #{}, Body: #{}, Front: #{}, Rear: #{}).", root, body, frontWheel, rearWheel);
        return root;
    }

    void PrefabLoader::destroyPrefab(Scene &scene, EntityID prefabRoot)
    {
        auto &registry = scene.GetRegistry();
        auto *rel = registry.GetComponent<RelationshipComponent>(prefabRoot);
        if (rel)
        {
            EntityID child = rel->FirstChild;
            while (child != kNullEntity)
            {
                auto *childRel = registry.GetComponent<RelationshipComponent>(child);
                EntityID next = childRel ? childRel->NextSibling : kNullEntity;
                registry.DestroyEntity(child);
                child = next;
            }
        }
        registry.DestroyEntity(prefabRoot);
        registry.FlushDestroyedEntities();
        LOG_INFO("[PrefabLoader] Destroyed prefab root #{} and child entities.", prefabRoot);
    }
}
