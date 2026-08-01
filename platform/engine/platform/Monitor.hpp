#ifndef PLATFORM_ENGINE_PLATFORM_MONITOR_HPP
#define PLATFORM_ENGINE_PLATFORM_MONITOR_HPP

#include <string>
#include <vector>

namespace platform
{
    struct DisplayMode
    {
        int Width{0};
        int Height{0};
        float RefreshRate{0.0f};
    };

    struct MonitorInfo
    {
        uint32_t ID{0};
        std::string Name{};
        int BoundsX{0};
        int BoundsY{0};
        int Width{0};
        int Height{0};
        float RefreshRate{0.0f};
        float ContentScale{1.0f};
        std::vector<DisplayMode> AvailableModes{};
    };

    class Monitor
    {
    public:
        [[nodiscard]] static std::vector<MonitorInfo> GetMonitors();
        [[nodiscard]] static MonitorInfo GetPrimaryMonitor();
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_MONITOR_HPP
