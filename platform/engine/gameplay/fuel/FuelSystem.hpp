#ifndef PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_SYSTEM_HPP

#include "engine/scene/Registry.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class FuelSystem
    {
    public:
        FuelSystem();

        void Update(Registry &registry, EntityID vehicleEntity, EventQueue *eventQueue, double dt);
        void Refill(Registry &registry, EntityID vehicleEntity, float amount, EventQueue *eventQueue);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_SYSTEM_HPP
