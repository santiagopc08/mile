#include "engine/platform/Platform.hpp"
#include "engine/core/Logger.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    bool Platform::s_initialized = false;
    std::string Platform::s_lastError = "";

    bool Platform::Initialize()
    {
        if (s_initialized)
        {
            return true;
        }

        LOG_INFO("[Platform] Initializing SDL...");

        if (!SDL_Init(SDL_INIT_VIDEO | SDL_INIT_EVENTS | SDL_INIT_GAMEPAD))
        {
            SetError(SDL_GetError());
            LOG_ERROR("[Platform] Failed to initialize SDL: {}", s_lastError);
            return false;
        }

        s_initialized = true;
        LOG_INFO("[Platform] Video & Events subsystem initialized.");
        LOG_INFO("[Platform] Platform initialized successfully.");
        return true;
    }

    void Platform::Shutdown()
    {
        if (!s_initialized)
        {
            return;
        }

        LOG_INFO("[Platform] Shutting down SDL...");
        SDL_Quit();
        s_initialized = false;
        LOG_INFO("[Platform] Platform shutdown complete.");
    }

    bool Platform::IsInitialized()
    {
        return s_initialized;
    }

    std::string Platform::GetLastError()
    {
        return s_lastError;
    }

    void Platform::SetError(const std::string &error)
    {
        s_lastError = error;
    }
}
