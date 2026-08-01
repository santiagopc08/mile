#ifndef PLATFORM_ENGINE_VEHICLE_VEHICLE_FACTORY_HPP
#define PLATFORM_ENGINE_VEHICLE_VEHICLE_FACTORY_HPP

#include "engine/scene/Registry.hpp"
#include "engine/vehicle/VehicleConfig.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"

namespace platform
{
    class VehicleFactory
    {
    public:
        static EntityID CreateVehicle(
            Registry &registry,
            const VehicleConfig &config = VehicleConfig{},
            const WheelConfig &wheelConfig = WheelConfig{},
            const SuspensionConfig &suspensionConfig = SuspensionConfig{}
        );

        static void DestroyVehicle(Registry &registry, EntityID vehicleEntity);
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_VEHICLE_FACTORY_HPP
