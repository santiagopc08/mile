#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_COMPONENT_HPP

#include "engine/vehicle/VehicleConfig.hpp"
#include "engine/scene/Entity.hpp"
#include <vector>

namespace platform
{
    struct VehicleInputs
    {
        float Throttle{0.0f}; // 0.0 to 1.0
        float Brake{0.0f};    // 0.0 to 1.0
        float Steering{0.0f}; // -1.0 (left) to +1.0 (right)
        bool ResetRequested{false};
    };

    struct VehicleRuntimeState
    {
        float SpeedKmh{0.0f};
        float EngineRPM{800.0f};
        float CurrentTorque{0.0f};
        int GroundedWheelCount{0};
        float AverageSuspensionCompression{0.0f};
    };

    struct VehicleComponent
    {
        bool active{true};
        EntityID body{kNullEntity};
        EntityID frontWheel{kNullEntity};
        EntityID rearWheel{kNullEntity};

        VehicleConfig Config{};
        VehicleInputs Inputs{};
        VehicleRuntimeState State{};

        std::vector<EntityID> WheelEntities;
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_COMPONENT_HPP
