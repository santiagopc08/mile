#ifndef PLATFORM_ENGINE_PHYSICS_SYSTEMS_PHYSICS_SYSTEM_HPP
#define PLATFORM_ENGINE_PHYSICS_SYSTEMS_PHYSICS_SYSTEM_HPP

#include "engine/physics/PhysicsWorld.hpp"
#include "engine/scene/Registry.hpp"

namespace platform
{
    class PhysicsSystem
    {
    public:
        PhysicsSystem();

        void Initialize(const PhysicsConfig &config = PhysicsConfig{}, EventQueue *eventQueue = nullptr);
        void Shutdown();

        void Update(Registry &registry, double dt);

        [[nodiscard]] PhysicsWorld &GetWorld() { return m_physicsWorld; }
        [[nodiscard]] const PhysicsWorld &GetWorld() const { return m_physicsWorld; }

    private:
        void CreatePendingBodies(Registry &registry);
        void SynchronizeTransforms(Registry &registry);

        PhysicsWorld m_physicsWorld;
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_SYSTEMS_PHYSICS_SYSTEM_HPP
