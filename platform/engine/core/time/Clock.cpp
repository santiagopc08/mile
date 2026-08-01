#include "engine/core/time/Clock.hpp"

namespace platform
{
    Clock::TimePoint Clock::Now()
    {
        return std::chrono::steady_clock::now();
    }

    uint64_t Clock::NanosecondsBetween(TimePoint start, TimePoint end)
    {
        return static_cast<uint64_t>(
            std::chrono::duration_cast<std::chrono::nanoseconds>(end - start).count());
    }

    uint64_t Clock::MicrosecondsBetween(TimePoint start, TimePoint end)
    {
        return static_cast<uint64_t>(
            std::chrono::duration_cast<std::chrono::microseconds>(end - start).count());
    }

    uint64_t Clock::MillisecondsBetween(TimePoint start, TimePoint end)
    {
        return static_cast<uint64_t>(
            std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());
    }

    double Clock::SecondsBetween(TimePoint start, TimePoint end)
    {
        auto ns = std::chrono::duration_cast<std::chrono::nanoseconds>(end - start).count();
        return static_cast<double>(ns) / 1'000'000'000.0;
    }
}
