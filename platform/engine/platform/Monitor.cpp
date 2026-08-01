#include "engine/platform/Monitor.hpp"
#include "engine/platform/Platform.hpp"
#include "engine/core/Logger.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    std::vector<MonitorInfo> Monitor::GetMonitors()
    {
        if (!Platform::IsInitialized())
        {
            Platform::Initialize();
        }

        std::vector<MonitorInfo> result;
        int count = 0;
        SDL_DisplayID *displays = SDL_GetDisplays(&count);

        if (!displays || count <= 0)
        {
            LOG_WARN("[Platform] No monitors detected.");
            return result;
        }

        for (int i = 0; i < count; ++i)
        {
            SDL_DisplayID displayID = displays[i];
            MonitorInfo info{};
            info.ID = static_cast<uint32_t>(displayID);

            const char *name = SDL_GetDisplayName(displayID);
            info.Name = name ? name : "Unknown Display";

            SDL_Rect bounds;
            if (SDL_GetDisplayBounds(displayID, &bounds))
            {
                info.BoundsX = bounds.x;
                info.BoundsY = bounds.y;
                info.Width = bounds.w;
                info.Height = bounds.h;
            }

            const SDL_DisplayMode *mode = SDL_GetCurrentDisplayMode(displayID);
            if (mode)
            {
                info.Width = mode->w;
                info.Height = mode->h;
                info.RefreshRate = mode->refresh_rate;
            }

            info.ContentScale = SDL_GetDisplayContentScale(displayID);

            // Fetch display modes
            int modeCount = 0;
            SDL_DisplayMode **modes = SDL_GetFullscreenDisplayModes(displayID, &modeCount);
            if (modes && modeCount > 0)
            {
                for (int m = 0; m < modeCount; ++m)
                {
                    if (modes[m])
                    {
                        DisplayMode dm;
                        dm.Width = modes[m]->w;
                        dm.Height = modes[m]->h;
                        dm.RefreshRate = modes[m]->refresh_rate;
                        info.AvailableModes.push_back(dm);
                    }
                }
                SDL_free((void *)modes);
            }

            result.push_back(info);
        }

        SDL_free(displays);
        return result;
    }

    MonitorInfo Monitor::GetPrimaryMonitor()
    {
        auto monitors = GetMonitors();
        if (!monitors.empty())
        {
            LOG_INFO("[Platform] Primary monitor detected: '{}' ({}x{} @ {}Hz, DPI scale {:.2f}).",
                     monitors[0].Name, monitors[0].Width, monitors[0].Height, monitors[0].RefreshRate, monitors[0].ContentScale);
            return monitors[0];
        }
        return MonitorInfo{};
    }
}
