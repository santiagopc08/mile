#include "examples/hill_climb/PhysicsValidationScene.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    PhysicsValidationScene::PhysicsValidationScene()
        : Scene("Physics Validation Scene")
    {
    }

    void PhysicsValidationScene::OnInitialize()
    {
        // 1. Setup Camera
        m_cameraManager.CreateCamera(1280.0f, 720.0f);

        // 2. Initialize Physics System
        PhysicsConfig config;
        config.Gravity = {0.0f, 9.81f};
        m_physicsSystem.Initialize(config, m_eventQueue);

        // 3. Ground (Static Body)
        m_groundEntity = CreateEntity("Ground");
        auto &groundTransform = GetRegistry().AddComponent<TransformComponent>(m_groundEntity);
        groundTransform.SetPosition({0.0f, 200.0f});
        groundTransform.SetScale({800.0f, 40.0f});

        auto &groundBody = GetRegistry().AddComponent<RigidBodyComponent>(m_groundEntity);
        groundBody.Type = BodyType::Static;

        auto &groundCollider = GetRegistry().AddComponent<ColliderComponent>(m_groundEntity);
        groundCollider.Shape = ColliderShape::Rectangle;
        groundCollider.Size = {800.0f, 40.0f};

        auto &groundShape = GetRegistry().AddComponent<ShapeComponent>(m_groundEntity);
        groundShape.Type = ShapeType::Rectangle;
        groundShape.Size = {800.0f, 40.0f};
        groundShape.Color = {0.3f, 0.7f, 0.3f, 1.0f}; // Green ground

        GetRegistry().AddComponent<RenderLayerComponent>(m_groundEntity);
        GetRegistry().AddComponent<VisibilityComponent>(m_groundEntity);

        // 4. Falling Box (Dynamic Body)
        m_boxEntity = CreateEntity("FallingBox");
        auto &boxTransform = GetRegistry().AddComponent<TransformComponent>(m_boxEntity);
        boxTransform.SetPosition({-50.0f, -150.0f});
        boxTransform.SetScale({48.0f, 48.0f});

        auto &boxBody = GetRegistry().AddComponent<RigidBodyComponent>(m_boxEntity);
        boxBody.Type = BodyType::Dynamic;
        boxBody.Mass = 2.0f;

        auto &boxCollider = GetRegistry().AddComponent<ColliderComponent>(m_boxEntity);
        boxCollider.Shape = ColliderShape::Rectangle;
        boxCollider.Size = {48.0f, 48.0f};
        boxCollider.Material.Restitution = 0.4f;

        auto &boxShape = GetRegistry().AddComponent<ShapeComponent>(m_boxEntity);
        boxShape.Type = ShapeType::Rectangle;
        boxShape.Size = {48.0f, 48.0f};
        boxShape.Color = {0.9f, 0.4f, 0.2f, 1.0f}; // Orange Box

        GetRegistry().AddComponent<RenderLayerComponent>(m_boxEntity);
        GetRegistry().AddComponent<VisibilityComponent>(m_boxEntity);

        // 5. Falling Circle / Secondary Box (Dynamic Body)
        m_circleEntity = CreateEntity("FallingCircle");
        auto &circleTransform = GetRegistry().AddComponent<TransformComponent>(m_circleEntity);
        circleTransform.SetPosition({50.0f, -250.0f});
        circleTransform.SetScale({40.0f, 40.0f});

        auto &circleBody = GetRegistry().AddComponent<RigidBodyComponent>(m_circleEntity);
        circleBody.Type = BodyType::Dynamic;
        circleBody.Mass = 1.5f;

        auto &circleCollider = GetRegistry().AddComponent<ColliderComponent>(m_circleEntity);
        circleCollider.Shape = ColliderShape::Circle;
        circleCollider.Radius = 20.0f;
        circleCollider.Material.Restitution = 0.6f;

        auto &circleShape = GetRegistry().AddComponent<ShapeComponent>(m_circleEntity);
        circleShape.Type = ShapeType::Rectangle;
        circleShape.Size = {40.0f, 40.0f};
        circleShape.Color = {0.2f, 0.6f, 0.9f, 1.0f}; // Blue Circle/Shape

        GetRegistry().AddComponent<RenderLayerComponent>(m_circleEntity);
        GetRegistry().AddComponent<VisibilityComponent>(m_circleEntity);

        LOG_INFO("[PhysicsScene] Initialized Physics Validation Scene with Ground (Static), Falling Box (Dynamic), and Falling Circle (Dynamic).");
    }

    void PhysicsValidationScene::OnUpdate(double dt)
    {
        m_physicsSystem.Update(GetRegistry(), dt);
    }

    void PhysicsValidationScene::OnShutdown()
    {
        m_physicsSystem.Shutdown();
    }
}
