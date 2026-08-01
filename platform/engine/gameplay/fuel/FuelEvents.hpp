#ifndef PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_EVENTS_HPP
#define PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_EVENTS_HPP

#include "engine/events/Event.hpp"

namespace platform
{
    class FuelLowEvent : public Event
    {
    public:
        explicit FuelLowEvent(float remainingFuel, uint64_t timestamp = 0)
            : Event(timestamp), m_remainingFuel(remainingFuel) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "FuelLowEvent"; }

        [[nodiscard]] float GetRemainingFuel() const { return m_remainingFuel; }

    private:
        float m_remainingFuel;
    };

    class FuelEmptyEvent : public Event
    {
    public:
        explicit FuelEmptyEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "FuelEmptyEvent"; }
    };

    class FuelRefilledEvent : public Event
    {
    public:
        explicit FuelRefilledEvent(float amount, uint64_t timestamp = 0)
            : Event(timestamp), m_amount(amount) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "FuelRefilledEvent"; }

        [[nodiscard]] float GetAmount() const { return m_amount; }

    private:
        float m_amount;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_FUEL_FUEL_EVENTS_HPP
