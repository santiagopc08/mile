#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EntityID VehicleFactory::CreateVehicle(
        Registry &registry,
        const VehicleConfig &config,
        const WheelConfig &wheelConfig,
        const SuspensionConfig &suspensionConfig
    )
    {
        // 1. Chassis Entity
        EntityID vehicleEntity = registry.CreateEntity(config.Name);

        auto &chassisTransform = registry.AddComponent<TransformComponent>(vehicleEntity);
        chassisTransform.SetPosition({0.0f, 0.0f});
        chassisTransform.SetScale({config.WheelBase, 40.0f});

        auto &chassisBody = registry.AddComponent<RigidBodyComponent>(vehicleEntity);
        chassisBody.Type = BodyType::Dynamic;
        chassisBody.Mass = config.Mass;

        auto &chassisCollider = registry.AddComponent<ColliderComponent>(vehicleEntity);
        chassisCollider.Shape = ColliderShape::Rectangle;
        chassisCollider.Size = {config.WheelBase, 40.0f};

        auto &chassisShape = registry.AddComponent<ShapeComponent>(vehicleEntity);
        chassisShape.Type = ShapeType::Rectangle;
        chassisShape.Size = {config.WheelBase, 40.0f};
        chassisShape.Color = {0.85f, 0.25f, 0.2f, 1.0f}; // Red Chassis

        registry.AddComponent<RenderLayerComponent>(vehicleEntity);
        registry.AddComponent<VisibilityComponent>(vehicleEntity);

        auto &vehicleComp = registry.AddComponent<VehicleComponent>(vehicleEntity);
        vehicleComp.Config = config;

        // 2. Attach Front and Rear Wheels
        float halfWheelBase = config.WheelBase * 0.45f;
        glm::vec2 wheelOffsets[2] = {
            {-halfWheelBase, 20.0f}, // Rear Wheel
            { halfWheelBase, 20.0f}  // Front Wheel
        };

        for (int i = 0; i < 2; ++i)
        {
            EntityID wheelEntity = registry.CreateEntity(i == 0 ? "RearWheel" : "FrontWheel");

            auto &wTransform = registry.AddComponent<TransformComponent>(wheelEntity);
            wTransform.SetPosition(wheelOffsets[i]);
            wTransform.SetScale({wheelConfig.Radius * 2.0f, wheelConfig.Radius * 2.0f});

            auto &wBody = registry.AddComponent<RigidBodyComponent>(wheelEntity);
            wBody.Type = BodyType::Dynamic;
            wBody.Mass = wheelConfig.Mass;

            auto &wCollider = registry.AddComponent<ColliderComponent>(wheelEntity);
            wCollider.Shape = ColliderShape::Circle;
            wCollider.Radius = wheelConfig.Radius;
            wCollider.Material.Friction = wheelConfig.Grip;

            auto &wShape = registry.AddComponent<ShapeComponent>(wheelEntity);
            wShape.Type = ShapeType::Rectangle;
            wShape.Size = {wheelConfig.Radius * 2.0f, wheelConfig.Radius * 2.0f};
            wShape.Color = {0.2f, 0.2f, 0.2f, 1.0f}; // Dark Grey Wheels

            registry.AddComponent<RenderLayerComponent>(wheelEntity);
            registry.AddComponent<VisibilityComponent>(wheelEntity);

            auto &wComp = registry.AddComponent<WheelComponent>(wheelEntity);
            wComp.Config = wheelConfig;
            wComp.Config.LocalOffset = wheelOffsets[i];
            wComp.Config.Role = (i == 0) ? WheelRole::Drive : WheelRole::Steering;
            wComp.Config.MotorEnabled = (i == 0);
            wComp.Config.SteeringEnabled = (i == 1);
            wComp.WheelEntity = wheelEntity;

            auto &sComp = registry.AddComponent<SuspensionComponent>(wheelEntity);
            sComp.Config = suspensionConfig;

            vehicleComp.WheelEntities.push_back(wheelEntity);
        }

        LOG_INFO("[VehicleFactory] Created vehicle '{}' with 2 wheels.", config.Name);
        return vehicleEntity;
    }

    void VehicleFactory::DestroyVehicle(Registry &registry, EntityID vehicleEntity)
    {
        if (auto *vComp = registry.GetComponent<VehicleComponent>(vehicleEntity))
        {
            for (EntityID wEntity : vComp->WheelEntities)
            {
                registry.DestroyEntity(wEntity);
            }
        }
        registry.DestroyEntity(vehicleEntity);
    }
}
