#ifndef PLATFORM_ENGINE_UI_THEME_THEME_MANAGER_HPP
#define PLATFORM_ENGINE_UI_THEME_THEME_MANAGER_HPP

#include "engine/ui/theme/Theme.hpp"
#include "engine/events/EventQueue.hpp"
#include <unordered_map>

namespace platform
{
    class ThemeManager
    {
    public:
        ThemeManager();

        void SetTheme(ThemeMode mode, EventQueue *eventQueue = nullptr);
        void RegisterCustomTheme(const std::string &name, const Theme &theme);

        [[nodiscard]] const Theme &GetActiveTheme() const { return m_activeTheme; }
        [[nodiscard]] ThemeMode GetActiveMode() const { return m_activeTheme.Mode; }

        static Theme CreateDarkTheme();
        static Theme CreateLightTheme();
        static Theme CreateHighContrastTheme();

    private:
        Theme m_activeTheme;
        std::unordered_map<std::string, Theme> m_customThemes;
    };
}

#endif // PLATFORM_ENGINE_UI_THEME_THEME_MANAGER_HPP
