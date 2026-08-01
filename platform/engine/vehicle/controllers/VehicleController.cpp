#include "engine/vehicle/controllers/VehicleController.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    VehicleController::VehicleController() = default;

    void VehicleController::Update(VehicleComponent &vehicle, const ActionContext &actionContext)
    {
        float throttle = 0.0f;
        float brake = 0.0f;
        float steer = 0.0f;

        if (actionContext.IsActionHeld(InputAction::MoveUp) || actionContext.IsActionTriggered(InputAction::MoveUp)) throttle += 1.0f;
        if (actionContext.IsActionHeld(InputAction::MoveDown) || actionContext.IsActionTriggered(InputAction::MoveDown)) brake += 1.0f;
        if (actionContext.IsActionHeld(InputAction::MoveLeft) || actionContext.IsActionTriggered(InputAction::MoveLeft)) steer -= 1.0f;
        if (actionContext.IsActionHeld(InputAction::MoveRight) || actionContext.IsActionTriggered(InputAction::MoveRight)) steer += 1.0f;

        vehicle.Inputs.Throttle = std::clamp(throttle, 0.0f, 1.0f);
        vehicle.Inputs.Brake = std::clamp(brake, 0.0f, 1.0f);
        vehicle.Inputs.Steering = std::clamp(steer, -1.0f, 1.0f);
        m_inputs = vehicle.Inputs;
    }

    void VehicleControllerSystem::setThrottle(VehicleControllerRuntimeComponent &runtime, float value)
    {
        runtime.throttle = std::clamp(value, 0.0f, 1.0f);
    }

    void VehicleControllerSystem::setSteering(VehicleControllerRuntimeComponent &runtime, float value)
    {
        runtime.steering = std::clamp(value, -1.0f, 1.0f);
    }

    void VehicleControllerSystem::setBrake(VehicleControllerRuntimeComponent &runtime, float value)
    {
        runtime.brake = std::clamp(value, 0.0f, 1.0f);
    }

    void VehicleControllerSystem::setReverse(VehicleControllerRuntimeComponent &runtime, bool reverse)
    {
        runtime.reverse = reverse;
    }

    void VehicleControllerSystem::reset(VehicleControllerRuntimeComponent &runtime)
    {
        runtime.throttle = 0.0f;
        runtime.steering = 0.0f;
        runtime.brake = 0.0f;
        runtime.reverse = false;
        runtime.enabled = true;
    }

    void VehicleControllerSystem::Update(Registry &registry, double dt)
    {
        (void)dt;
        auto view = registry.GetView<VehicleControllerSettingsComponent, VehicleControllerRuntimeComponent, MotorSettingsComponent, MotorRuntimeComponent>();

        view.Each([](EntityID entity, VehicleControllerSettingsComponent &settings, VehicleControllerRuntimeComponent &cRuntime, MotorSettingsComponent &mSettings, MotorRuntimeComponent &mRuntime) {
            (void)entity;
            (void)settings;
            if (!cRuntime.enabled)
            {
                mRuntime.targetSpeed = 0.0f;
                return;
            }

            // Translate normalized throttle (0..1) and reverse flag to motor target speed
            float direction = cRuntime.reverse ? -1.0f : 1.0f;
            float rawSpeed = cRuntime.throttle * mSettings.maxSpeed * direction;

            // Apply braking reduction
            float effectiveSpeed = rawSpeed * (1.0f - cRuntime.brake);
            mRuntime.targetSpeed = effectiveSpeed;
        });
    }
}
