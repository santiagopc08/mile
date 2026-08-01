#include "engine/vehicle/systems/MotorSystem.hpp"
#include "engine/vehicle/components/WheelJointComponent.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void MotorSystem::createMotor(Registry &registry, EntityID vehicleRoot, EntityID frontWheel, EntityID rearWheel, const MotorSettingsComponent &settings)
    {
        registry.AddComponent<MotorSettingsComponent>(vehicleRoot, settings);
        registry.AddComponent<MotorRuntimeComponent>(vehicleRoot);

        auto &motorComp = registry.AddComponent<VehicleMotorComponent>(vehicleRoot);
        motorComp.frontWheel = frontWheel;
        motorComp.rearWheel = rearWheel;

        LOG_INFO("[MotorSystem] Created vehicle motor on root entity #{}.", vehicleRoot);
    }

    void MotorSystem::destroyMotor(Registry &registry, EntityID vehicleRoot)
    {
        registry.RemoveComponent<MotorSettingsComponent>(vehicleRoot);
        registry.RemoveComponent<MotorRuntimeComponent>(vehicleRoot);
        registry.RemoveComponent<VehicleMotorComponent>(vehicleRoot);
        LOG_INFO("[MotorSystem] Destroyed motor on root entity #{}.", vehicleRoot);
    }

    void MotorSystem::enable(MotorRuntimeComponent &runtime)
    {
        runtime.enabled = true;
    }

    void MotorSystem::disable(MotorRuntimeComponent &runtime)
    {
        runtime.enabled = false;
        runtime.appliedSpeed = 0.0f;
    }

    void MotorSystem::setTargetSpeed(MotorRuntimeComponent &runtime, float targetSpeed)
    {
        runtime.targetSpeed = targetSpeed;
    }

    void MotorSystem::setMaxTorque(MotorSettingsComponent &settings, float maxTorque)
    {
        settings.maxTorque = maxTorque;
    }

    void MotorSystem::setDriveMode(MotorSettingsComponent &settings, DriveMode mode)
    {
        switch (mode)
        {
        case DriveMode::FWD:
            settings.frontWheelDrive = true;
            settings.rearWheelDrive = false;
            break;
        case DriveMode::RWD:
            settings.frontWheelDrive = false;
            settings.rearWheelDrive = true;
            break;
        case DriveMode::AWD:
        default:
            settings.frontWheelDrive = true;
            settings.rearWheelDrive = true;
            break;
        }
    }

    DriveMode MotorSystem::driveMode(const MotorSettingsComponent &settings) const
    {
        if (settings.frontWheelDrive && settings.rearWheelDrive) return DriveMode::AWD;
        if (settings.frontWheelDrive) return DriveMode::FWD;
        return DriveMode::RWD;
    }

    void MotorSystem::stop(MotorRuntimeComponent &runtime)
    {
        runtime.targetSpeed = 0.0f;
    }

    void MotorSystem::Update(Registry &registry, PhysicsWorld &world, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<MotorSettingsComponent, MotorRuntimeComponent, VehicleMotorComponent>();

        view.Each([&registry, &world, delta](EntityID entity, MotorSettingsComponent &settings, MotorRuntimeComponent &runtime, VehicleMotorComponent &motor) {
            (void)entity;
            if (!runtime.enabled)
            {
                runtime.appliedSpeed = 0.0f;
                runtime.currentTorque = 0.0f;
                return;
            }

            // Smooth speed ramp towards target speed
            float rate = (runtime.targetSpeed != 0.0f) ? settings.accelerationRate : settings.decelerationRate;
            if (runtime.appliedSpeed < runtime.targetSpeed)
            {
                runtime.appliedSpeed = std::min(runtime.targetSpeed, runtime.appliedSpeed + rate * delta);
            }
            else if (runtime.appliedSpeed > runtime.targetSpeed)
            {
                runtime.appliedSpeed = std::max(runtime.targetSpeed, runtime.appliedSpeed - rate * delta);
            }

            // Clamp max speed
            runtime.appliedSpeed = std::clamp(runtime.appliedSpeed, -settings.maxSpeed, settings.maxSpeed);
            runtime.currentTorque = settings.maxTorque;

            // Apply motor speed to front wheel joint if FWD or AWD
            if (settings.frontWheelDrive && motor.frontWheel != kNullEntity)
            {
                auto *fwJointComp = registry.GetComponent<WheelJointComponent>(motor.frontWheel);
                if (fwJointComp && fwJointComp->jointHandle)
                {
                    world.SetWheelJointMotor(fwJointComp->jointHandle, true, runtime.appliedSpeed, settings.maxTorque);
                }
            }

            // Apply motor speed to rear wheel joint if RWD or AWD
            if (settings.rearWheelDrive && motor.rearWheel != kNullEntity)
            {
                auto *rwJointComp = registry.GetComponent<WheelJointComponent>(motor.rearWheel);
                if (rwJointComp && rwJointComp->jointHandle)
                {
                    world.SetWheelJointMotor(rwJointComp->jointHandle, true, runtime.appliedSpeed, settings.maxTorque);
                }
            }
        });
    }
}
