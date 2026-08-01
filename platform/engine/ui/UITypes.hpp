#ifndef PLATFORM_ENGINE_UI_UI_TYPES_HPP
#define PLATFORM_ENGINE_UI_UI_TYPES_HPP

#include <cstdint>

namespace platform
{
    enum class WidgetState : uint8_t
    {
        Visible = 0,
        Hidden,
        Enabled,
        Disabled,
        Focused,
        Hovered,
        Pressed
    };

    enum class LayoutMode : uint8_t
    {
        Absolute = 0,
        Vertical,
        Horizontal,
        Anchor
    };

    enum class AnchorPoint : uint8_t
    {
        TopLeft = 0,
        TopCenter,
        TopRight,
        CenterLeft,
        Center,
        CenterRight,
        BottomLeft,
        BottomCenter,
        BottomRight
    };

    enum class UILayer : uint8_t
    {
        Background = 0,
        HUD,
        Menu,
        Modal,
        Notification,
        Tooltip,
        Debug
    };
}

#endif // PLATFORM_ENGINE_UI_UI_TYPES_HPP
