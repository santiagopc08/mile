#include "engine/vehicle/powertrain/Powertrain.hpp"
#include <algorithm>
#include <cmath>

namespace platform
{
    Powertrain::Powertrain() = default;

    void Powertrain::Update(VehicleComponent &vehicle, float averageWheelSpeed, double dt)
    {
        (void)dt;
        float throttle = std::clamp(vehicle.Inputs.Throttle, 0.0f, 1.0f);

        // Compute RPM based on wheel speed and transmission gear ratio
        float targetRPM = m_idleRPM + std::abs(averageWheelSpeed) * m_gearRatio * 30.0f;
        m_engineRPM = std::clamp(targetRPM, m_idleRPM, m_maxRPM);

        // Torque curve (simple linear scaling modulated by max torque)
        float maxTorque = vehicle.Config.MaxMotorTorque;
        m_currentTorque = throttle * maxTorque;

        vehicle.State.EngineRPM = m_engineRPM;
        vehicle.State.CurrentTorque = m_currentTorque;
    }
}
