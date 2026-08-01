#ifndef PLATFORM_EDITOR_UI_EDITOR_THEME_HPP
#define PLATFORM_EDITOR_UI_EDITOR_THEME_HPP

#include <glm/glm.hpp>

namespace platform::EditorTheme
{
    inline constexpr glm::vec4 WindowBackground{0.055f, 0.065f, 0.085f, 1.0f};
    inline constexpr glm::vec4 PanelBackground{0.10f, 0.125f, 0.165f, 1.0f};
    inline constexpr glm::vec4 PanelHeader{0.145f, 0.18f, 0.235f, 1.0f};
    inline constexpr glm::vec4 PanelBorder{0.22f, 0.27f, 0.34f, 1.0f};
    inline constexpr glm::vec4 ViewportBackground{0.035f, 0.045f, 0.065f, 1.0f};

    inline constexpr glm::vec4 Accent{0.20f, 0.72f, 0.92f, 1.0f};
    inline constexpr glm::vec4 AccentDim{0.12f, 0.42f, 0.55f, 1.0f};
    inline constexpr glm::vec4 Warning{0.96f, 0.72f, 0.28f, 1.0f};
    inline constexpr glm::vec4 Danger{0.92f, 0.36f, 0.36f, 1.0f};
    inline constexpr glm::vec4 Success{0.38f, 0.84f, 0.52f, 1.0f};

    inline constexpr glm::vec4 Text{0.86f, 0.90f, 0.94f, 1.0f};
    inline constexpr glm::vec4 TextMuted{0.50f, 0.60f, 0.70f, 1.0f};
    inline constexpr glm::vec4 TextDisabled{0.32f, 0.38f, 0.45f, 1.0f};
    inline constexpr glm::vec4 TextOnAccent{0.03f, 0.06f, 0.09f, 1.0f};

    inline constexpr glm::vec4 Button{0.16f, 0.20f, 0.26f, 1.0f};
    inline constexpr glm::vec4 ButtonHover{0.22f, 0.28f, 0.36f, 1.0f};
    inline constexpr glm::vec4 ButtonActive{0.20f, 0.72f, 0.92f, 1.0f};
    inline constexpr glm::vec4 RowHover{0.16f, 0.21f, 0.28f, 1.0f};
    inline constexpr glm::vec4 RowSelected{0.14f, 0.38f, 0.50f, 1.0f};
    inline constexpr glm::vec4 Grid{0.11f, 0.14f, 0.19f, 1.0f};
    inline constexpr glm::vec4 GridAxis{0.24f, 0.30f, 0.40f, 1.0f};

    inline constexpr float RowHeight = 22.0f;
    inline constexpr float HeaderHeight = 26.0f;
    inline constexpr float TextScale = 1.5f;
    inline constexpr float TitleScale = 1.75f;
}

#endif // PLATFORM_EDITOR_UI_EDITOR_THEME_HPP
