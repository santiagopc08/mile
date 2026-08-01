#include "engine/physics/PhysicsWorld.hpp"
#include "engine/physics/PhysicsEvents.hpp"
#include "engine/core/Logger.hpp"
#include <box2d/box2d.h>

namespace platform
{
    class RuntimeContactListener : public b2ContactListener
    {
    public:
        explicit RuntimeContactListener(EventQueue *eventQueue)
            : m_eventQueue(eventQueue) {}

        void SetEventQueue(EventQueue *eventQueue) { m_eventQueue = eventQueue; }

        void BeginContact(b2Contact *contact) override
        {
            if (!contact || !m_eventQueue)
            {
                return;
            }

            b2Fixture *fixtureA = contact->GetFixtureA();
            b2Fixture *fixtureB = contact->GetFixtureB();

            if (!fixtureA || !fixtureB)
            {
                return;
            }

            EntityID entityA = static_cast<EntityID>(fixtureA->GetBody()->GetUserData().pointer);
            EntityID entityB = static_cast<EntityID>(fixtureB->GetBody()->GetUserData().pointer);

            if (fixtureA->IsSensor() || fixtureB->IsSensor())
            {
                EntityID trigger = fixtureA->IsSensor() ? entityA : entityB;
                EntityID other = fixtureA->IsSensor() ? entityB : entityA;
                m_eventQueue->Push(std::make_shared<TriggerEnteredEvent>(trigger, other));
            }
            else
            {
                m_eventQueue->Push(std::make_shared<CollisionStartedEvent>(entityA, entityB));
            }
        }

        void EndContact(b2Contact *contact) override
        {
            if (!contact || !m_eventQueue)
            {
                return;
            }

            b2Fixture *fixtureA = contact->GetFixtureA();
            b2Fixture *fixtureB = contact->GetFixtureB();

            if (!fixtureA || !fixtureB)
            {
                return;
            }

            EntityID entityA = static_cast<EntityID>(fixtureA->GetBody()->GetUserData().pointer);
            EntityID entityB = static_cast<EntityID>(fixtureB->GetBody()->GetUserData().pointer);

            if (fixtureA->IsSensor() || fixtureB->IsSensor())
            {
                EntityID trigger = fixtureA->IsSensor() ? entityA : entityB;
                EntityID other = fixtureA->IsSensor() ? entityB : entityA;
                m_eventQueue->Push(std::make_shared<TriggerExitedEvent>(trigger, other));
            }
            else
            {
                m_eventQueue->Push(std::make_shared<CollisionEndedEvent>(entityA, entityB));
            }
        }

    private:
        EventQueue *m_eventQueue{nullptr};
    };

    struct PhysicsWorldImpl
    {
        PhysicsConfig Config;
        EventQueue *Events{nullptr};
        std::unique_ptr<b2World> B2World;
        RuntimeContactListener ContactListener{nullptr};

        PhysicsWorldImpl() = default;
    };

    PhysicsWorld::PhysicsWorld()
        : m_impl(std::make_unique<PhysicsWorldImpl>())
    {
    }

    PhysicsWorld::~PhysicsWorld()
    {
        Shutdown();
    }

    bool PhysicsWorld::Initialize(const PhysicsConfig &config, EventQueue *eventQueue)
    {
        m_impl->Config = config;
        m_impl->Events = eventQueue;
        m_impl->ContactListener.SetEventQueue(eventQueue);

        b2Vec2 gravity(config.Gravity.x, config.Gravity.y);
        m_impl->B2World = std::make_unique<b2World>(gravity);
        m_impl->B2World->SetAllowSleeping(config.SleepEnabled);
        m_impl->B2World->SetContactListener(&m_impl->ContactListener);

        LOG_INFO("[PhysicsWorld] Physics world initialized (Gravity: ({:.2f}, {:.2f})).",
                 config.Gravity.x, config.Gravity.y);
        return true;
    }

    void PhysicsWorld::Shutdown()
    {
        if (m_impl && m_impl->B2World)
        {
            LOG_INFO("[PhysicsWorld] Shutting down physics world...");
            m_impl->B2World.reset();
        }
    }

    void PhysicsWorld::Step(double dt)
    {
        if (!m_impl->B2World)
        {
            return;
        }

        float timeStep = static_cast<float>(dt > 0.0 ? dt : m_impl->Config.FixedTimeStep);
        m_impl->B2World->Step(timeStep, m_impl->Config.VelocityIterations, m_impl->Config.PositionIterations);
    }

    void *PhysicsWorld::CreateBody(EntityID entity, const TransformComponent &transform, const RigidBodyComponent &bodyComp, const ColliderComponent *colliderComp)
    {
        if (!m_impl->B2World)
        {
            return nullptr;
        }

        b2BodyDef bodyDef;
        switch (bodyComp.Type)
        {
        case BodyType::Static:
            bodyDef.type = b2_staticBody;
            break;
        case BodyType::Kinematic:
            bodyDef.type = b2_kinematicBody;
            break;
        case BodyType::Dynamic:
        default:
            bodyDef.type = b2_dynamicBody;
            break;
        }

        bodyDef.position.Set(transform.Position.x, transform.Position.y);
        bodyDef.angle = glm::radians(transform.Rotation);
        bodyDef.linearVelocity.Set(bodyComp.LinearVelocity.x, bodyComp.LinearVelocity.y);
        bodyDef.angularVelocity = glm::radians(bodyComp.AngularVelocity);
        bodyDef.fixedRotation = bodyComp.FixedRotation;
        bodyDef.allowSleep = bodyComp.SleepingAllowed;
        bodyDef.gravityScale = bodyComp.GravityScale;
        bodyDef.userData.pointer = static_cast<uintptr_t>(entity);

        b2Body *body = m_impl->B2World->CreateBody(&bodyDef);

        if (colliderComp)
        {
            b2FixtureDef fixtureDef;
            fixtureDef.density = colliderComp->Material.Density;
            fixtureDef.friction = colliderComp->Material.Friction;
            fixtureDef.restitution = colliderComp->Material.Restitution;
            fixtureDef.isSensor = colliderComp->IsSensor;
            fixtureDef.filter.categoryBits = colliderComp->CategoryBits;
            fixtureDef.filter.maskBits = colliderComp->MaskBits;

            b2PolygonShape boxShape;
            b2CircleShape circleShape;

            if (colliderComp->Shape == ColliderShape::Rectangle)
            {
                boxShape.SetAsBox(
                    (colliderComp->Size.x * 0.5f) * transform.Scale.x,
                    (colliderComp->Size.y * 0.5f) * transform.Scale.y,
                    b2Vec2(colliderComp->Offset.x, colliderComp->Offset.y),
                    0.0f
                );
                fixtureDef.shape = &boxShape;
                body->CreateFixture(&fixtureDef);
            }
            else if (colliderComp->Shape == ColliderShape::Circle)
            {
                circleShape.m_p.Set(colliderComp->Offset.x, colliderComp->Offset.y);
                circleShape.m_radius = colliderComp->Radius * transform.Scale.x;
                fixtureDef.shape = &circleShape;
                body->CreateFixture(&fixtureDef);
            }
        }

        return static_cast<void *>(body);
    }

    void PhysicsWorld::DestroyBody(void *bodyHandle)
    {
        if (!m_impl->B2World || !bodyHandle)
        {
            return;
        }

        auto *body = static_cast<b2Body *>(bodyHandle);
        m_impl->B2World->DestroyBody(body);
    }

    void *PhysicsWorld::CreateRevoluteJoint(void *bodyAHandle, void *bodyBHandle, const glm::vec2 &anchorWorldPos)
    {
        if (!m_impl->B2World || !bodyAHandle || !bodyBHandle)
        {
            return nullptr;
        }

        auto *bodyA = static_cast<b2Body *>(bodyAHandle);
        auto *bodyB = static_cast<b2Body *>(bodyBHandle);

        b2RevoluteJointDef jointDef;
        jointDef.Initialize(bodyA, bodyB, b2Vec2(anchorWorldPos.x, anchorWorldPos.y));
        jointDef.collideConnected = false;
        jointDef.enableMotor = false;
        jointDef.enableLimit = false;

        b2RevoluteJoint *joint = static_cast<b2RevoluteJoint *>(m_impl->B2World->CreateJoint(&jointDef));
        LOG_INFO("[PhysicsWorld] Created revolute joint between Body #{} and Body #{} at ({:.2f}, {:.2f}).",
                 bodyA->GetUserData().pointer, bodyB->GetUserData().pointer, anchorWorldPos.x, anchorWorldPos.y);
        return static_cast<void *>(joint);
    }

    void *PhysicsWorld::CreateWheelJoint(void *bodyAHandle, void *bodyBHandle, const glm::vec2 &anchorWorldPos, const glm::vec2 &axis, float frequencyHz, float dampingRatio, float lowerTranslation, float upperTranslation)
    {
        if (!m_impl->B2World || !bodyAHandle || !bodyBHandle)
        {
            return nullptr;
        }

        auto *bodyA = static_cast<b2Body *>(bodyAHandle);
        auto *bodyB = static_cast<b2Body *>(bodyBHandle);

        b2WheelJointDef jointDef;
        jointDef.Initialize(bodyA, bodyB, b2Vec2(anchorWorldPos.x, anchorWorldPos.y), b2Vec2(axis.x, axis.y));
        jointDef.collideConnected = false;
        jointDef.enableMotor = false;
        jointDef.enableLimit = true;
        jointDef.lowerTranslation = lowerTranslation;
        jointDef.upperTranslation = upperTranslation;
        jointDef.stiffness = frequencyHz;
        jointDef.damping = dampingRatio;

        b2WheelJoint *joint = static_cast<b2WheelJoint *>(m_impl->B2World->CreateJoint(&jointDef));
        LOG_INFO("[PhysicsWorld] Created Wheel Joint (Suspension) between Body #{} and Body #{} (Freq: {:.1f}Hz, Damping: {:.2f}).",
                 bodyA->GetUserData().pointer, bodyB->GetUserData().pointer, frequencyHz, dampingRatio);
        return static_cast<void *>(joint);
    }

    void PhysicsWorld::SetWheelJointMotor(void *jointHandle, bool enable, float motorSpeed, float maxTorque)
    {
        if (!jointHandle)
        {
            return;
        }

        auto *joint = static_cast<b2WheelJoint *>(jointHandle);
        joint->EnableMotor(enable);
        joint->SetMotorSpeed(motorSpeed);
        joint->SetMaxMotorTorque(maxTorque);
    }

    void PhysicsWorld::DestroyJoint(void *jointHandle)
    {
        if (!m_impl->B2World || !jointHandle)
        {
            return;
        }

        auto *joint = static_cast<b2Joint *>(jointHandle);
        m_impl->B2World->DestroyJoint(joint);
    }

    void PhysicsWorld::GetBodyTransform(void *bodyHandle, glm::vec2 &position, float &rotation) const
    {
        if (!bodyHandle)
        {
            return;
        }

        auto *body = static_cast<const b2Body *>(bodyHandle);
        const b2Vec2 &pos = body->GetPosition();
        position.x = pos.x;
        position.y = pos.y;
        rotation = glm::degrees(body->GetAngle());
    }

    void PhysicsWorld::SetBodyTransform(void *bodyHandle, const glm::vec2 &position, float rotation)
    {
        if (!bodyHandle)
        {
            return;
        }

        auto *body = static_cast<b2Body *>(bodyHandle);
        body->SetTransform(b2Vec2(position.x, position.y), glm::radians(rotation));
    }

    int PhysicsWorld::GetBodyCount() const
    {
        return m_impl->B2World ? m_impl->B2World->GetBodyCount() : 0;
    }

    int PhysicsWorld::GetActiveBodyCount() const
    {
        if (!m_impl->B2World)
        {
            return 0;
        }

        int active = 0;
        for (const b2Body *b = m_impl->B2World->GetBodyList(); b; b = b->GetNext())
        {
            if (b->IsAwake() && b->IsEnabled())
            {
                active++;
            }
        }
        return active;
    }

    int PhysicsWorld::GetSleepingBodyCount() const
    {
        if (!m_impl->B2World)
        {
            return 0;
        }

        int sleeping = 0;
        for (const b2Body *b = m_impl->B2World->GetBodyList(); b; b = b->GetNext())
        {
            if (!b->IsAwake() && b->IsEnabled())
            {
                sleeping++;
            }
        }
        return sleeping;
    }

    int PhysicsWorld::GetContactCount() const
    {
        return m_impl->B2World ? m_impl->B2World->GetContactCount() : 0;
    }

    const PhysicsConfig &PhysicsWorld::GetConfig() const
    {
        return m_impl->Config;
    }
}
