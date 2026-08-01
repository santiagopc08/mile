#ifndef PLATFORM_ENGINE_PLATFORM_CURSOR_HPP
#define PLATFORM_ENGINE_PLATFORM_CURSOR_HPP

namespace platform
{
    enum class SystemCursor
    {
        Default = 0,
        Text,
        Wait,
        Crosshair,
        Hand,
        NotAllowed,
        ResizeNS,
        ResizeEW
    };

    class Cursor
    {
    public:
        static void Show();
        static void Hide();
        [[nodiscard]] static bool IsVisible();

        static void Lock();
        static void Unlock();
        [[nodiscard]] static bool IsLocked();

        static void SetSystemCursor(SystemCursor cursor);
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_CURSOR_HPP
