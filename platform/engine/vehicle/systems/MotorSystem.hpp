#ifndef PLATFORM_ENGINE_VEHICLE_SYSTEMS_MOTOR_SYSTEM_HPP
#define PLATFORM_ENGINE_VEHICLE_SYSTEMS_MOTOR_SYSTEM_HPP

#include "engine/vehicle/components/MotorSettingsComponent.hpp"
#include "engine/vehicle/components/MotorRuntimeComponent.hpp"
#include "engine/vehicle/components/VehicleMotorComponent.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class DriveMode
    {
        FWD,
        RWD,
        AWD
    };

    class MotorSystem
    {
    public:
        MotorSystem() = default;

        void createMotor(Registry &registry, EntityID vehicleRoot, EntityID frontWheel, EntityID rearWheel, const MotorSettingsComponent &settings = MotorSettingsComponent{});
        void destroyMotor(Registry &registry, EntityID vehicleRoot);

        void enable(MotorRuntimeComponent &runtime);
        void disable(MotorRuntimeComponent &runtime);

        void setTargetSpeed(MotorRuntimeComponent &runtime, float targetSpeed);
        void setMaxTorque(MotorSettingsComponent &settings, float maxTorque);
        void setDriveMode(MotorSettingsComponent &settings, DriveMode mode);
        void stop(MotorRuntimeComponent &runtime);

        [[nodiscard]] float currentSpeed(const MotorRuntimeComponent &runtime) const { return runtime.appliedSpeed; }
        [[nodiscard]] float currentTorque(const MotorRuntimeComponent &runtime) const { return runtime.currentTorque; }
        [[nodiscard]] DriveMode driveMode(const MotorSettingsComponent &settings) const;
        [[nodiscard]] bool isRunning(const MotorRuntimeComponent &runtime) const { return runtime.enabled && std::abs(runtime.appliedSpeed) > 0.1f; }

        void Update(Registry &registry, PhysicsWorld &world, double dt);
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_SYSTEMS_MOTOR_SYSTEM_HPP
