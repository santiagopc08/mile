#ifndef PLATFORM_ENGINE_PLATFORM_PLATFORM_HPP
#define PLATFORM_ENGINE_PLATFORM_PLATFORM_HPP

#include <string>

namespace platform
{
    class Platform
    {
    public:
        static bool Initialize();
        static void Shutdown();
        [[nodiscard]] static bool IsInitialized();

        [[nodiscard]] static std::string GetLastError();

    private:
        static bool s_initialized;
        static std::string s_lastError;

        static void SetError(const std::string &error);
        friend class SDLWindow;
        friend class EventPump;
        friend class Monitor;
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_PLATFORM_HPP
