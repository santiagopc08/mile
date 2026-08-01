#ifndef PLATFORM_ENGINE_VEHICLE_CONTROLLERS_VEHICLE_CONTROLLER_HPP
#define PLATFORM_ENGINE_VEHICLE_CONTROLLERS_VEHICLE_CONTROLLER_HPP

#include "engine/input/actions/ActionContext.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/VehicleControllerSettingsComponent.hpp"
#include "engine/vehicle/components/VehicleControllerRuntimeComponent.hpp"
#include "engine/vehicle/components/MotorSettingsComponent.hpp"
#include "engine/vehicle/components/MotorRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"

namespace platform
{
    class VehicleController
    {
    public:
        VehicleController();

        void Update(VehicleComponent &vehicle, const ActionContext &actionContext);

        [[nodiscard]] float GetThrottle() const { return m_inputs.Throttle; }
        [[nodiscard]] float GetBrake() const { return m_inputs.Brake; }
        [[nodiscard]] float GetSteering() const { return m_inputs.Steering; }

    private:
        VehicleInputs m_inputs{};
    };

    class VehicleControllerSystem
    {
    public:
        VehicleControllerSystem() = default;

        void setThrottle(VehicleControllerRuntimeComponent &runtime, float value);
        void setSteering(VehicleControllerRuntimeComponent &runtime, float value);
        void setBrake(VehicleControllerRuntimeComponent &runtime, float value);
        void setReverse(VehicleControllerRuntimeComponent &runtime, bool reverse);
        void reset(VehicleControllerRuntimeComponent &runtime);

        void applyBrake(VehicleControllerRuntimeComponent &runtime) { setBrake(runtime, 1.0f); }
        void releaseBrake(VehicleControllerRuntimeComponent &runtime) { setBrake(runtime, 0.0f); }

        void Update(Registry &registry, double dt);
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_CONTROLLERS_VEHICLE_CONTROLLER_HPP
