#ifndef PLATFORM_ENGINE_INPUT_KEY_CODES_HPP
#define PLATFORM_ENGINE_INPUT_KEY_CODES_HPP

#include <cstdint>

namespace platform
{
    /// Runtime key codes. SDL keycodes are translated into these
    /// at the Platform boundary. Gameplay never sees SDL constants.
    enum class Key : int32_t
    {
        Unknown = 0,

        // Letters
        A, B, C, D, E, F, G, H, I, J, K, L, M,
        N, O, P, Q, R, S, T, U, V, W, X, Y, Z,

        // Digits
        Num0, Num1, Num2, Num3, Num4,
        Num5, Num6, Num7, Num8, Num9,

        // Function keys
        F1, F2, F3, F4, F5, F6,
        F7, F8, F9, F10, F11, F12,

        // Arrows
        Up, Down, Left, Right,

        // Modifiers
        LeftShift, RightShift,
        LeftCtrl, RightCtrl,
        LeftAlt, RightAlt,

        // Special
        Space, Enter, Tab, Backspace, Escape,
        Insert, Delete, Home, End, PageUp, PageDown,
        CapsLock, NumLock, ScrollLock, PrintScreen, Pause,

        // Punctuation
        Minus, Equals, LeftBracket, RightBracket,
        Backslash, Semicolon, Apostrophe, Grave,
        Comma, Period, Slash,

        Count
    };

    enum class MouseButton : uint8_t
    {
        Left = 1,
        Middle = 2,
        Right = 3,
        X1 = 4,
        X2 = 5,

        Count
    };
}

#endif // PLATFORM_ENGINE_INPUT_KEY_CODES_HPP
