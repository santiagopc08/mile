#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/physics/PhysicsWorld.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/physics/PhysicsEvents.hpp"
#include "engine/events/EventQueue.hpp"
#include "examples/hill_climb/PhysicsValidationScene.hpp"

TEST_CASE("PhysicsWorld Initialization and Body Creation", "[Physics]")
{
    platform::PhysicsConfig config;
    config.Gravity = {0.0f, 9.81f};

    platform::PhysicsWorld world;
    REQUIRE(world.Initialize(config));
    REQUIRE(world.GetBodyCount() == 0);

    platform::TransformComponent transform;
    transform.SetPosition({0.0f, 10.0f});

    platform::RigidBodyComponent bodyComp;
    bodyComp.Type = platform::BodyType::Dynamic;

    platform::ColliderComponent colliderComp;
    colliderComp.Shape = platform::ColliderShape::Rectangle;
    colliderComp.Size = {20.0f, 20.0f};

    void *bodyHandle = world.CreateBody(1, transform, bodyComp, &colliderComp);
    REQUIRE(bodyHandle != nullptr);
    REQUIRE(world.GetBodyCount() == 1);

    glm::vec2 pos;
    float rot = 0.0f;
    world.GetBodyTransform(bodyHandle, pos, rot);
    REQUIRE(pos.x == Catch::Approx(0.0f));
    REQUIRE(pos.y == Catch::Approx(10.0f));

    world.DestroyBody(bodyHandle);
    REQUIRE(world.GetBodyCount() == 0);

    world.Shutdown();
}

TEST_CASE("Physics Simulation Stepping and Fall Motion", "[Physics]")
{
    platform::PhysicsConfig config;
    config.Gravity = {0.0f, 9.81f};

    platform::PhysicsWorld world;
    REQUIRE(world.Initialize(config));

    platform::TransformComponent transform;
    transform.SetPosition({0.0f, 0.0f});

    platform::RigidBodyComponent bodyComp;
    bodyComp.Type = platform::BodyType::Dynamic;

    platform::ColliderComponent colliderComp;
    colliderComp.Shape = platform::ColliderShape::Rectangle;
    colliderComp.Size = {10.0f, 10.0f};

    void *bodyHandle = world.CreateBody(10, transform, bodyComp, &colliderComp);

    // Step physics 10 times
    for (int i = 0; i < 10; ++i)
    {
        world.Step(0.016);
    }

    glm::vec2 pos;
    float rot = 0.0f;
    world.GetBodyTransform(bodyHandle, pos, rot);

    // Body with fixture should fall downwards under gravity
    REQUIRE(pos.y > 0.0f);

    world.Shutdown();
}

TEST_CASE("ECS PhysicsSystem Integration and Transform Sync", "[Physics]")
{
    platform::Registry registry;
    platform::EntityID entity = registry.CreateEntity("DynamicBody");

    auto &transform = registry.AddComponent<platform::TransformComponent>(entity);
    transform.SetPosition({0.0f, 0.0f});

    auto &body = registry.AddComponent<platform::RigidBodyComponent>(entity);
    body.Type = platform::BodyType::Dynamic;

    auto &collider = registry.AddComponent<platform::ColliderComponent>(entity);
    collider.Shape = platform::ColliderShape::Rectangle;
    collider.Size = {10.0f, 10.0f};

    platform::PhysicsSystem system;
    system.Initialize();

    // First update creates body and steps simulation
    system.Update(registry, 0.016);

    REQUIRE(body.RuntimeBodyHandle != nullptr);
    REQUIRE(transform.Position.y > 0.0f); // Transform updated back from physics

    system.Shutdown();
}

TEST_CASE("Collision Event Generation", "[Physics]")
{
    platform::EventQueue eventQueue;
    bool collisionTriggered = false;

    eventQueue.Subscribe([&collisionTriggered](const platform::Event &event) {
        if (event.GetCategory() == platform::EventCategory::Physics)
        {
            collisionTriggered = true;
        }
    });

    platform::PhysicsWorld world;
    platform::PhysicsConfig config;
    config.Gravity = {0.0f, 9.81f};
    world.Initialize(config, &eventQueue);

    // Static Ground
    platform::TransformComponent groundT;
    groundT.SetPosition({0.0f, 100.0f});
    platform::RigidBodyComponent groundB;
    groundB.Type = platform::BodyType::Static;
    platform::ColliderComponent groundC;
    groundC.Size = {500.0f, 20.0f};
    world.CreateBody(1, groundT, groundB, &groundC);

    // Dynamic Box right above ground
    platform::TransformComponent boxT;
    boxT.SetPosition({0.0f, 85.0f});
    platform::RigidBodyComponent boxB;
    boxB.Type = platform::BodyType::Dynamic;
    platform::ColliderComponent boxC;
    boxC.Size = {20.0f, 20.0f};
    world.CreateBody(2, boxT, boxB, &boxC);

    // Step physics to trigger contact
    for (int i = 0; i < 5; ++i)
    {
        world.Step(0.016);
    }
    eventQueue.ProcessEvents();

    REQUIRE(collisionTriggered);
    world.Shutdown();
}

TEST_CASE("PhysicsValidationScene Demo Initialization", "[PhysicsScene]")
{
    platform::PhysicsValidationScene scene;
    REQUIRE(scene.Initialize());
    scene.Activate();

    REQUIRE(scene.IsActive());
    REQUIRE(scene.GetGroundEntity() != platform::kNullEntity);
    REQUIRE(scene.GetBoxEntity() != platform::kNullEntity);
    REQUIRE(scene.GetCircleEntity() != platform::kNullEntity);

    scene.Update(0.016);
    scene.Deactivate();
    scene.Shutdown();
}
