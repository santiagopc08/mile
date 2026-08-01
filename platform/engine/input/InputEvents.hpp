#ifndef PLATFORM_ENGINE_INPUT_INPUT_EVENTS_HPP
#define PLATFORM_ENGINE_INPUT_INPUT_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/input/KeyCodes.hpp"

namespace platform
{
    class KeyPressedEvent : public Event
    {
    public:
        KeyPressedEvent(Key key, bool isRepeat = false, uint64_t timestamp = 0)
            : Event(timestamp), m_key(key), m_isRepeat(isRepeat) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; } // Will be handled by Input Category
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Input; }
        [[nodiscard]] std::string_view GetName() const override { return "KeyPressedEvent"; }

        [[nodiscard]] Key GetKey() const { return m_key; }
        [[nodiscard]] bool IsRepeat() const { return m_isRepeat; }

    private:
        Key m_key{Key::Unknown};
        bool m_isRepeat{false};
    };

    class KeyReleasedEvent : public Event
    {
    public:
        explicit KeyReleasedEvent(Key key, uint64_t timestamp = 0)
            : Event(timestamp), m_key(key) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Input; }
        [[nodiscard]] std::string_view GetName() const override { return "KeyReleasedEvent"; }

        [[nodiscard]] Key GetKey() const { return m_key; }

    private:
        Key m_key{Key::Unknown};
    };

    class MouseMovedEvent : public Event
    {
    public:
        MouseMovedEvent(float x, float y, float dx, float dy, uint64_t timestamp = 0)
            : Event(timestamp), m_x(x), m_y(y), m_dx(dx), m_dy(dy) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Input; }
        [[nodiscard]] std::string_view GetName() const override { return "MouseMovedEvent"; }

        [[nodiscard]] float GetX() const { return m_x; }
        [[nodiscard]] float GetY() const { return m_y; }
        [[nodiscard]] float GetDeltaX() const { return m_dx; }
        [[nodiscard]] float GetDeltaY() const { return m_dy; }

    private:
        float m_x{0.0f};
        float m_y{0.0f};
        float m_dx{0.0f};
        float m_dy{0.0f};
    };

    class MouseButtonPressedEvent : public Event
    {
    public:
        MouseButtonPressedEvent(MouseButton button, uint64_t timestamp = 0)
            : Event(timestamp), m_button(button) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Input; }
        [[nodiscard]] std::string_view GetName() const override { return "MouseButtonPressedEvent"; }

        [[nodiscard]] MouseButton GetButton() const { return m_button; }

    private:
        MouseButton m_button{MouseButton::Left};
    };

    class MouseButtonReleasedEvent : public Event
    {
    public:
        MouseButtonReleasedEvent(MouseButton button, uint64_t timestamp = 0)
            : Event(timestamp), m_button(button) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Input; }
        [[nodiscard]] std::string_view GetName() const override { return "MouseButtonReleasedEvent"; }

        [[nodiscard]] MouseButton GetButton() const { return m_button; }

    private:
        MouseButton m_button{MouseButton::Left};
    };

    class MouseScrolledEvent : public Event
    {
    public:
        MouseScrolledEvent(float xOffset, float yOffset, uint64_t timestamp = 0)
            : Event(timestamp), m_xOffset(xOffset), m_yOffset(yOffset) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Input; }
        [[nodiscard]] std::string_view GetName() const override { return "MouseScrolledEvent"; }

        [[nodiscard]] float GetXOffset() const { return m_xOffset; }
        [[nodiscard]] float GetYOffset() const { return m_yOffset; }

    private:
        float m_xOffset{0.0f};
        float m_yOffset{0.0f};
    };
}

#endif // PLATFORM_ENGINE_INPUT_INPUT_EVENTS_HPP
