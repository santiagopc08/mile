#include "engine/gameplay/fuel/FuelSystem.hpp"
#include "engine/gameplay/fuel/FuelComponent.hpp"
#include "engine/gameplay/fuel/FuelEvents.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"

namespace platform
{
    FuelSystem::FuelSystem() = default;

    void FuelSystem::Update(Registry &registry, EntityID vehicleEntity, EventQueue *eventQueue, double dt)
    {
        auto *fuelComp = registry.GetComponent<FuelComponent>(vehicleEntity);
        auto *vehicleComp = registry.GetComponent<VehicleComponent>(vehicleEntity);

        if (!fuelComp)
        {
            return;
        }

        float frameDt = static_cast<float>(dt);
        float throttle = vehicleComp ? vehicleComp->Inputs.Throttle : 0.0f;

        float drain = fuelComp->IdleConsumption + (throttle * fuelComp->ConsumptionRate);
        float previousFuel = fuelComp->CurrentFuel;

        fuelComp->CurrentFuel -= drain * frameDt;
        if (fuelComp->CurrentFuel <= 0.0f)
        {
            fuelComp->CurrentFuel = 0.0f;
            if (!fuelComp->OutOfFuel)
            {
                fuelComp->OutOfFuel = true;
                if (eventQueue)
                {
                    eventQueue->Push(std::make_shared<FuelEmptyEvent>());
                }
            }
        }
        else
        {
            fuelComp->OutOfFuel = false;
        }

        // Check critical threshold crossing
        if (previousFuel > fuelComp->CriticalThreshold && fuelComp->CurrentFuel <= fuelComp->CriticalThreshold)
        {
            if (eventQueue)
            {
                eventQueue->Push(std::make_shared<FuelLowEvent>(fuelComp->CurrentFuel));
            }
        }

        // Disable motor throttle if out of fuel
        if (fuelComp->OutOfFuel && vehicleComp)
        {
            vehicleComp->Inputs.Throttle = 0.0f;
        }
    }

    void FuelSystem::Refill(Registry &registry, EntityID vehicleEntity, float amount, EventQueue *eventQueue)
    {
        auto *fuelComp = registry.GetComponent<FuelComponent>(vehicleEntity);
        if (fuelComp)
        {
            fuelComp->CurrentFuel = std::min(fuelComp->MaximumFuel, fuelComp->CurrentFuel + amount);
            fuelComp->OutOfFuel = false;
            if (eventQueue)
            {
                eventQueue->Push(std::make_shared<FuelRefilledEvent>(amount));
            }
        }
    }
}
