#include "engine/vehicle/systems/SuspensionSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void *SuspensionSystem::createSuspension(PhysicsWorld &world, EntityID body, EntityID wheel, void *bodyHandle, void *wheelHandle, const glm::vec2 &anchor, const glm::vec2 &axis, float frequencyHz, float dampingRatio)
    {
        (void)body;
        (void)wheel;
        void *joint = world.CreateWheelJoint(bodyHandle, wheelHandle, anchor, axis, frequencyHz, dampingRatio, -0.35f, 0.35f);
        LOG_INFO("[SuspensionSystem] Created suspension joint (Freq: {:.1f}Hz, Damping: {:.2f}).", frequencyHz, dampingRatio);
        return joint;
    }

    void SuspensionSystem::destroySuspension(PhysicsWorld &world, void *jointHandle)
    {
        if (jointHandle)
        {
            world.DestroyJoint(jointHandle);
            LOG_INFO("[SuspensionSystem] Destroyed suspension joint.");
        }
    }

    void SuspensionSystem::setStiffness(void *jointHandle, float frequencyHz)
    {
        (void)jointHandle;
        (void)frequencyHz;
    }

    void SuspensionSystem::setDamping(void *jointHandle, float dampingRatio)
    {
        (void)jointHandle;
        (void)dampingRatio;
    }

    void SuspensionSystem::setTravel(void *jointHandle, float lowerTranslation, float upperTranslation)
    {
        (void)jointHandle;
        (void)lowerTranslation;
        (void)upperTranslation;
    }

    void SuspensionSystem::setAxis(void *jointHandle, const glm::vec2 &axis)
    {
        (void)jointHandle;
        (void)axis;
    }

    void SuspensionSystem::enable(SuspensionComponent &comp)
    {
        comp.enabled = true;
    }

    void SuspensionSystem::disable(SuspensionComponent &comp)
    {
        comp.enabled = false;
    }

    void SuspensionSystem::Update(Registry &registry, PhysicsWorld &world, double dt)
    {
        (void)world;
        (void)dt;
        auto view = registry.GetView<SuspensionComponent>();
        view.Each([](EntityID entity, SuspensionComponent &susp) {
            (void)entity;
            if (susp.enabled)
            {
                // Update runtime compression state
                susp.State.Compression = 0.1f;
                susp.State.Grounded = true;
            }
        });
    }
}
