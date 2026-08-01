#ifndef PLATFORM_ENGINE_CORE_TIME_CLOCK_HPP
#define PLATFORM_ENGINE_CORE_TIME_CLOCK_HPP

#include <chrono>
#include <cstdint>

namespace platform
{
    /// High-precision monotonic clock.
    /// All time is stored internally as integer nanoseconds.
    /// Floating-point conversions happen only at the API boundary.
    class Clock
    {
    public:
        using TimePoint = std::chrono::steady_clock::time_point;
        using Duration = std::chrono::steady_clock::duration;

        /// Returns current monotonic time point.
        [[nodiscard]] static TimePoint Now();

        /// Returns elapsed nanoseconds between two time points.
        [[nodiscard]] static uint64_t NanosecondsBetween(TimePoint start, TimePoint end);

        /// Returns elapsed microseconds between two time points.
        [[nodiscard]] static uint64_t MicrosecondsBetween(TimePoint start, TimePoint end);

        /// Returns elapsed milliseconds between two time points.
        [[nodiscard]] static uint64_t MillisecondsBetween(TimePoint start, TimePoint end);

        /// Returns elapsed seconds between two time points.
        [[nodiscard]] static double SecondsBetween(TimePoint start, TimePoint end);
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_CLOCK_HPP
