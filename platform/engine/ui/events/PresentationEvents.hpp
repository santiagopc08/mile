#ifndef PLATFORM_ENGINE_UI_EVENTS_PRESENTATION_EVENTS_HPP
#define PLATFORM_ENGINE_UI_EVENTS_PRESENTATION_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/ui/screens/Screen.hpp"
#include <string>

namespace platform
{
    class ScreenChangedEvent : public Event
    {
    public:
        ScreenChangedEvent(ScreenType oldScreen, ScreenType newScreen)
            : m_oldScreen(oldScreen), m_newScreen(newScreen) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::ScreenChanged; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::UI; }
        [[nodiscard]] std::string_view GetName() const override { return "ScreenChangedEvent"; }

        [[nodiscard]] ScreenType GetOldScreen() const { return m_oldScreen; }
        [[nodiscard]] ScreenType GetNewScreen() const { return m_newScreen; }

    private:
        ScreenType m_oldScreen;
        ScreenType m_newScreen;
    };

    class WidgetFocusedEvent : public Event
    {
    public:
        explicit WidgetFocusedEvent(std::string widgetName)
            : m_widgetName(std::move(widgetName)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::WidgetFocused; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::UI; }
        [[nodiscard]] std::string_view GetName() const override { return "WidgetFocusedEvent"; }

        [[nodiscard]] const std::string &GetWidgetName() const { return m_widgetName; }

    private:
        std::string m_widgetName;
    };

    class ButtonPressedEvent : public Event
    {
    public:
        explicit ButtonPressedEvent(std::string buttonName)
            : m_buttonName(std::move(buttonName)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::ButtonPressed; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::UI; }
        [[nodiscard]] std::string_view GetName() const override { return "ButtonPressedEvent"; }

        [[nodiscard]] const std::string &GetButtonName() const { return m_buttonName; }

    private:
        std::string m_buttonName;
    };

    class NotificationShownEvent : public Event
    {
    public:
        explicit NotificationShownEvent(std::string title)
            : m_title(std::move(title)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::NotificationShown; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::UI; }
        [[nodiscard]] std::string_view GetName() const override { return "NotificationShownEvent"; }

        [[nodiscard]] const std::string &GetTitle() const { return m_title; }

    private:
        std::string m_title;
    };

    class NotificationHiddenEvent : public Event
    {
    public:
        explicit NotificationHiddenEvent(std::string title)
            : m_title(std::move(title)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::NotificationHidden; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::UI; }
        [[nodiscard]] std::string_view GetName() const override { return "NotificationHiddenEvent"; }

        [[nodiscard]] const std::string &GetTitle() const { return m_title; }

    private:
        std::string m_title;
    };

    class ThemeChangedEvent : public Event
    {
    public:
        explicit ThemeChangedEvent(std::string themeName)
            : m_themeName(std::move(themeName)) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::ThemeChanged; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::UI; }
        [[nodiscard]] std::string_view GetName() const override { return "ThemeChangedEvent"; }

        [[nodiscard]] const std::string &GetThemeName() const { return m_themeName; }

    private:
        std::string m_themeName;
    };
}

#endif // PLATFORM_ENGINE_UI_EVENTS_PRESENTATION_EVENTS_HPP
