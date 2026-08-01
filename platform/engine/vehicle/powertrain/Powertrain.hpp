#ifndef PLATFORM_ENGINE_VEHICLE_POWERTRAIN_POWERTRAIN_HPP
#define PLATFORM_ENGINE_VEHICLE_POWERTRAIN_POWERTRAIN_HPP

#include "engine/vehicle/VehicleConfig.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"

namespace platform
{
    class Powertrain
    {
    public:
        Powertrain();

        void Update(VehicleComponent &vehicle, float averageWheelSpeed, double dt);

        [[nodiscard]] float GetCurrentTorque() const { return m_currentTorque; }
        [[nodiscard]] float GetEngineRPM() const { return m_engineRPM; }

    private:
        float m_currentTorque{0.0f};
        float m_engineRPM{800.0f};
        float m_gearRatio{3.5f};
        float m_idleRPM{800.0f};
        float m_maxRPM{6000.0f};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_POWERTRAIN_POWERTRAIN_HPP
