#ifndef PLATFORM_ENGINE_EVENTS_WINDOW_EVENTS_HPP
#define PLATFORM_ENGINE_EVENTS_WINDOW_EVENTS_HPP

#include "engine/events/Event.hpp"

namespace platform
{
    class WindowCreatedEvent : public Event
    {
    public:
        WindowCreatedEvent(int width, int height, uint64_t timestamp = 0)
            : Event(timestamp), m_width(width), m_height(height) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::WindowCreated; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Window; }
        [[nodiscard]] std::string_view GetName() const override { return "WindowCreatedEvent"; }
        [[nodiscard]] int GetWidth() const { return m_width; }
        [[nodiscard]] int GetHeight() const { return m_height; }

    private:
        int m_width{0};
        int m_height{0};
    };

    class WindowClosedEvent : public Event
    {
    public:
        explicit WindowClosedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::WindowClosed; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Window; }
        [[nodiscard]] std::string_view GetName() const override { return "WindowClosedEvent"; }
    };

    class WindowResizedEvent : public Event
    {
    public:
        WindowResizedEvent(int width, int height, uint64_t timestamp = 0)
            : Event(timestamp), m_width(width), m_height(height) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::WindowResized; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Window; }
        [[nodiscard]] std::string_view GetName() const override { return "WindowResizedEvent"; }
        [[nodiscard]] int GetWidth() const { return m_width; }
        [[nodiscard]] int GetHeight() const { return m_height; }

    private:
        int m_width{0};
        int m_height{0};
    };

    class WindowFocusedEvent : public Event
    {
    public:
        explicit WindowFocusedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::WindowFocused; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Window; }
        [[nodiscard]] std::string_view GetName() const override { return "WindowFocusedEvent"; }
    };

    class WindowLostFocusEvent : public Event
    {
    public:
        explicit WindowLostFocusEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::WindowLostFocus; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Window; }
        [[nodiscard]] std::string_view GetName() const override { return "WindowLostFocusEvent"; }
    };
}

#endif // PLATFORM_ENGINE_EVENTS_WINDOW_EVENTS_HPP
