#ifndef PLATFORM_ENGINE_PLATFORM_CLIPBOARD_HPP
#define PLATFORM_ENGINE_PLATFORM_CLIPBOARD_HPP

#include <string>
#include <string_view>

namespace platform
{
    class Clipboard
    {
    public:
        static bool SetText(std::string_view text);
        [[nodiscard]] static std::string GetText();
        [[nodiscard]] static bool HasText();
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_CLIPBOARD_HPP
