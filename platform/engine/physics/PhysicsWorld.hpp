#ifndef PLATFORM_ENGINE_PHYSICS_PHYSICS_WORLD_HPP
#define PLATFORM_ENGINE_PHYSICS_PHYSICS_WORLD_HPP

#include "engine/physics/PhysicsConfig.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/events/EventQueue.hpp"
#include <memory>

namespace platform
{
    struct PhysicsWorldImpl;

    class PhysicsWorld
    {
    public:
        PhysicsWorld();
        ~PhysicsWorld();

        bool Initialize(const PhysicsConfig &config = PhysicsConfig{}, EventQueue *eventQueue = nullptr);
        void Shutdown();

        void Step(double dt);

        void *CreateBody(EntityID entity, const TransformComponent &transform, const RigidBodyComponent &bodyComp, const ColliderComponent *colliderComp = nullptr);
        void DestroyBody(void *bodyHandle);

        void *CreateRevoluteJoint(void *bodyAHandle, void *bodyBHandle, const glm::vec2 &anchorWorldPos);
        void *CreateWheelJoint(void *bodyAHandle, void *bodyBHandle, const glm::vec2 &anchorWorldPos, const glm::vec2 &axis = {0.0f, 1.0f}, float frequencyHz = 5.0f, float dampingRatio = 0.7f, float lowerTranslation = -0.35f, float upperTranslation = 0.35f);
        void SetWheelJointMotor(void *jointHandle, bool enable, float motorSpeed, float maxTorque);
        void DestroyJoint(void *jointHandle);

        void GetBodyTransform(void *bodyHandle, glm::vec2 &position, float &rotation) const;
        void SetBodyTransform(void *bodyHandle, const glm::vec2 &position, float rotation);

        [[nodiscard]] int GetBodyCount() const;
        [[nodiscard]] int GetActiveBodyCount() const;
        [[nodiscard]] int GetSleepingBodyCount() const;
        [[nodiscard]] int GetContactCount() const;
        [[nodiscard]] const PhysicsConfig &GetConfig() const;

    private:
        std::unique_ptr<PhysicsWorldImpl> m_impl;
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_PHYSICS_WORLD_HPP
