#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"

namespace platform
{
    PhysicsSystem::PhysicsSystem() = default;

    void PhysicsSystem::Initialize(const PhysicsConfig &config, EventQueue *eventQueue)
    {
        m_physicsWorld.Initialize(config, eventQueue);
    }

    void PhysicsSystem::Shutdown()
    {
        m_physicsWorld.Shutdown();
    }

    void PhysicsSystem::Update(Registry &registry, double dt)
    {
        CreatePendingBodies(registry);
        m_physicsWorld.Step(dt);
        SynchronizeTransforms(registry);
    }

    void PhysicsSystem::CreatePendingBodies(Registry &registry)
    {
        auto view = registry.GetView<TransformComponent, RigidBodyComponent, ActiveComponent>();
        view.Each([this, &registry](EntityID entity, TransformComponent &transform, RigidBodyComponent &bodyComp, ActiveComponent &active) {
            if (!active.Enabled)
            {
                return;
            }

            if (!bodyComp.RuntimeBodyHandle)
            {
                const auto *colliderComp = registry.GetComponent<ColliderComponent>(entity);
                bodyComp.RuntimeBodyHandle = m_physicsWorld.CreateBody(entity, transform, bodyComp, colliderComp);
            }
        });
    }

    void PhysicsSystem::SynchronizeTransforms(Registry &registry)
    {
        auto view = registry.GetView<TransformComponent, RigidBodyComponent, ActiveComponent>();
        view.Each([this](EntityID entity, TransformComponent &transform, RigidBodyComponent &bodyComp, ActiveComponent &active) {
            (void)entity;
            if (!active.Enabled || !bodyComp.RuntimeBodyHandle)
            {
                return;
            }

            // Only dynamic/kinematic body transforms are written back to ECS
            if (bodyComp.Type != BodyType::Static)
            {
                glm::vec2 pos;
                float rot = 0.0f;
                m_physicsWorld.GetBodyTransform(bodyComp.RuntimeBodyHandle, pos, rot);
                transform.SetPosition(pos);
                transform.SetRotation(rot);
            }
        });
    }
}
