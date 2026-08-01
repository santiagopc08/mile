#ifndef PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_COMPONENT_HPP

namespace platform
{
    struct FuelComponent
    {
        float MaximumFuel{100.0f};
        float CurrentFuel{100.0f};
        float ConsumptionRate{2.5f};      // Base drain per second
        float IdleConsumption{0.5f};      // Idle drain
        float CriticalThreshold{20.0f};   // Low fuel warning threshold
        bool OutOfFuel{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_COMPONENT_HPP
