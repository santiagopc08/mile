#ifndef PLATFORM_ENGINE_VEHICLE_SYSTEMS_SUSPENSION_SYSTEM_HPP
#define PLATFORM_ENGINE_VEHICLE_SYSTEMS_SUSPENSION_SYSTEM_HPP

#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/vehicle/components/SuspensionSettingsComponent.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include "engine/scene/Registry.hpp"

namespace platform
{
    class SuspensionSystem
    {
    public:
        SuspensionSystem() = default;

        void *createSuspension(PhysicsWorld &world, EntityID body, EntityID wheel, void *bodyHandle, void *wheelHandle, const glm::vec2 &anchor, const glm::vec2 &axis = {0.0f, 1.0f}, float frequencyHz = 5.0f, float dampingRatio = 0.7f);
        void destroySuspension(PhysicsWorld &world, void *jointHandle);

        void setStiffness(void *jointHandle, float frequencyHz);
        void setDamping(void *jointHandle, float dampingRatio);
        void setTravel(void *jointHandle, float lowerTranslation, float upperTranslation);
        void setAxis(void *jointHandle, const glm::vec2 &axis);

        void enable(SuspensionComponent &comp);
        void disable(SuspensionComponent &comp);

        void Update(Registry &registry, PhysicsWorld &world, double dt);
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_SYSTEMS_SUSPENSION_SYSTEM_HPP
