#ifndef PLATFORM_ENGINE_APP_LOOP_STATISTICS_HPP
#define PLATFORM_ENGINE_APP_LOOP_STATISTICS_HPP

#include <cstdint>

namespace platform
{
    struct LoopStatistics
    {
        double FrameTimeMs{0.0};
        double FPS{0.0};
        double CpuTimeMs{0.0};
        double UpdateTimeMs{0.0};
        double RenderTimeMs{0.0};
        uint64_t EventCount{0};
        uint64_t FrameNumber{0};
    };
}

#endif // PLATFORM_ENGINE_APP_LOOP_STATISTICS_HPP
