#ifndef PLATFORM_ENGINE_VEHICLE_SYSTEMS_VEHICLE_PHYSICS_SYSTEM_HPP
#define PLATFORM_ENGINE_VEHICLE_SYSTEMS_VEHICLE_PHYSICS_SYSTEM_HPP

#include "engine/scene/Registry.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include "engine/vehicle/powertrain/Powertrain.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"

namespace platform
{
    class VehiclePhysicsSystem
    {
    public:
        VehiclePhysicsSystem();

        void Update(Registry &registry, PhysicsWorld &physicsWorld, const ActionContext &actionContext, double dt);

    private:
        Powertrain m_powertrain;
        VehicleController m_controller;
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_SYSTEMS_VEHICLE_PHYSICS_SYSTEM_HPP
