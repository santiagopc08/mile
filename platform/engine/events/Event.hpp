#ifndef PLATFORM_ENGINE_EVENTS_EVENT_HPP
#define PLATFORM_ENGINE_EVENTS_EVENT_HPP

#include "engine/events/EventType.hpp"
#include "engine/events/EventCategory.hpp"
#include <string_view>
#include <cstdint>

namespace platform
{
    class Event
    {
    public:
        virtual ~Event() = default;

        [[nodiscard]] virtual EventType GetEventType() const = 0;
        [[nodiscard]] virtual EventCategory GetCategory() const = 0;
        [[nodiscard]] virtual std::string_view GetName() const = 0;

        [[nodiscard]] uint64_t GetTimestamp() const { return m_timestamp; }
        [[nodiscard]] bool IsHandled() const { return m_handled; }
        void SetHandled(bool handled = true) { m_handled = handled; }

    protected:
        explicit Event(uint64_t timestamp = 0) : m_timestamp(timestamp) {}

    private:
        uint64_t m_timestamp{0};
        bool m_handled{false};
    };
}

#endif // PLATFORM_ENGINE_EVENTS_EVENT_HPP
