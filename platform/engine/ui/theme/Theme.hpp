#ifndef PLATFORM_ENGINE_UI_THEME_THEME_HPP
#define PLATFORM_ENGINE_UI_THEME_THEME_HPP

#include <string>
#include <glm/glm.hpp>

namespace platform
{
    enum class ThemeMode
    {
        Dark = 0,
        Light,
        HighContrast,
        Custom
    };

    struct Theme
    {
        std::string Name{"Dark Default"};
        ThemeMode Mode{ThemeMode::Dark};

        glm::vec4 PrimaryColor{0.15f, 0.45f, 0.85f, 1.0f};
        glm::vec4 SecondaryColor{0.25f, 0.25f, 0.3f, 1.0f};
        glm::vec4 BackgroundColor{0.08f, 0.08f, 0.1f, 0.95f};
        glm::vec4 TextColor{0.95f, 0.95f, 0.95f, 1.0f};
        glm::vec4 AccentColor{1.0f, 0.75f, 0.0f, 1.0f};

        float BaseFontSize{16.0f};
        float BaseSpacing{8.0f};
        float BorderWidth{1.0f};
        float CornerRadius{4.0f};
        double AnimationDurationSeconds{0.25};
    };
}

#endif // PLATFORM_ENGINE_UI_THEME_THEME_HPP
