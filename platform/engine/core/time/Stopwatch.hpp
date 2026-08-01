#ifndef PLATFORM_ENGINE_CORE_TIME_STOPWATCH_HPP
#define PLATFORM_ENGINE_CORE_TIME_STOPWATCH_HPP

#include "engine/core/time/Clock.hpp"
#include <cstdint>

namespace platform
{
    /// Utility stopwatch for profiling.
    class Stopwatch
    {
    public:
        Stopwatch();

        void Start();
        void Stop();
        void Reset();
        void Restart();

        [[nodiscard]] uint64_t ElapsedNanoseconds() const;
        [[nodiscard]] uint64_t ElapsedMicroseconds() const;
        [[nodiscard]] double ElapsedMilliseconds() const;
        [[nodiscard]] double ElapsedSeconds() const;

        [[nodiscard]] bool IsRunning() const { return m_running; }

    private:
        Clock::TimePoint m_startTime{};
        uint64_t m_accumulatedNs{0};
        bool m_running{false};
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_STOPWATCH_HPP
