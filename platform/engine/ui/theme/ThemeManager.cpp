#include "engine/ui/theme/ThemeManager.hpp"
#include "engine/ui/events/PresentationEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    ThemeManager::ThemeManager()
    {
        m_activeTheme = CreateDarkTheme();
    }

    void ThemeManager::SetTheme(ThemeMode mode, EventQueue *eventQueue)
    {
        switch (mode)
        {
        case ThemeMode::Dark:
            m_activeTheme = CreateDarkTheme();
            break;
        case ThemeMode::Light:
            m_activeTheme = CreateLightTheme();
            break;
        case ThemeMode::HighContrast:
            m_activeTheme = CreateHighContrastTheme();
            break;
        case ThemeMode::Custom:
            break;
        }

        LOG_INFO("[ThemeManager] Switched active UI theme to '{}'.", m_activeTheme.Name);

        if (eventQueue)
        {
            eventQueue->Push(std::make_shared<ThemeChangedEvent>(m_activeTheme.Name));
        }
    }

    void ThemeManager::RegisterCustomTheme(const std::string &name, const Theme &theme)
    {
        m_customThemes[name] = theme;
    }

    Theme ThemeManager::CreateDarkTheme()
    {
        Theme t;
        t.Name = "Dark Default";
        t.Mode = ThemeMode::Dark;
        t.PrimaryColor = glm::vec4(0.15f, 0.45f, 0.85f, 1.0f);
        t.SecondaryColor = glm::vec4(0.25f, 0.25f, 0.3f, 1.0f);
        t.BackgroundColor = glm::vec4(0.08f, 0.08f, 0.1f, 0.95f);
        t.TextColor = glm::vec4(0.95f, 0.95f, 0.95f, 1.0f);
        t.AccentColor = glm::vec4(1.0f, 0.75f, 0.0f, 1.0f);
        return t;
    }

    Theme ThemeManager::CreateLightTheme()
    {
        Theme t;
        t.Name = "Light Clean";
        t.Mode = ThemeMode::Light;
        t.PrimaryColor = glm::vec4(0.2f, 0.6f, 0.95f, 1.0f);
        t.SecondaryColor = glm::vec4(0.85f, 0.85f, 0.9f, 1.0f);
        t.BackgroundColor = glm::vec4(0.95f, 0.95f, 0.98f, 0.95f);
        t.TextColor = glm::vec4(0.1f, 0.1f, 0.12f, 1.0f);
        t.AccentColor = glm::vec4(0.9f, 0.4f, 0.0f, 1.0f);
        return t;
    }

    Theme ThemeManager::CreateHighContrastTheme()
    {
        Theme t;
        t.Name = "High Contrast";
        t.Mode = ThemeMode::HighContrast;
        t.PrimaryColor = glm::vec4(1.0f, 1.0f, 0.0f, 1.0f);
        t.SecondaryColor = glm::vec4(0.0f, 0.0f, 0.0f, 1.0f);
        t.BackgroundColor = glm::vec4(0.0f, 0.0f, 0.0f, 1.0f);
        t.TextColor = glm::vec4(1.0f, 1.0f, 1.0f, 1.0f);
        t.AccentColor = glm::vec4(0.0f, 1.0f, 1.0f, 1.0f);
        return t;
    }
}
