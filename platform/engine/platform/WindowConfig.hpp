#ifndef PLATFORM_ENGINE_PLATFORM_WINDOW_CONFIG_HPP
#define PLATFORM_ENGINE_PLATFORM_WINDOW_CONFIG_HPP

#include <string>

namespace platform
{
    struct WindowConfig
    {
        std::string Title{"Platform Application"};
        int Width{1280};
        int Height{720};
        int MinWidth{320};
        int MinHeight{240};
        bool Fullscreen{false};
        bool Resizable{true};
        bool HighDPI{true};
        bool VSync{true};
        bool Borderless{false};
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_WINDOW_CONFIG_HPP
