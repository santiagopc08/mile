#ifndef PLATFORM_ENGINE_CORE_TIME_FRAME_TIMER_HPP
#define PLATFORM_ENGINE_CORE_TIME_FRAME_TIMER_HPP

#include "engine/core/time/Clock.hpp"
#include <cstdint>

namespace platform
{
    struct FrameDiagnostics
    {
        double FPS{0.0};
        double AverageFPS{0.0};
        double AverageFrameTimeMs{0.0};
        double BestFrameTimeMs{1e9};
        double WorstFrameTimeMs{0.0};
    };

    /// Per-frame timing.
    /// Stores delta and elapsed time as integer nanoseconds internally.
    class FrameTimer
    {
    public:
        FrameTimer();

        /// Call exactly once at the beginning of each frame.
        void Tick();

        /// Reset all accumulated state.
        void Reset();

        /// Delta time for the current frame (seconds).
        [[nodiscard]] double DeltaTime() const;

        /// Elapsed time since Reset (seconds).
        [[nodiscard]] double ElapsedTime() const;

        /// Raw delta time in nanoseconds (integer precision).
        [[nodiscard]] uint64_t DeltaTimeNs() const { return m_deltaNs; }

        /// Raw elapsed time in nanoseconds (integer precision).
        [[nodiscard]] uint64_t ElapsedTimeNs() const { return m_elapsedNs; }

        /// Current frame number (zero-indexed, increments on Tick).
        [[nodiscard]] uint64_t FrameNumber() const { return m_frameNumber; }

        /// Instantaneous FPS based on the last frame.
        [[nodiscard]] double FPS() const;

        /// Smoothed FPS (exponential moving average).
        [[nodiscard]] double SmoothedFPS() const { return m_smoothedFPS; }

        /// Frame time in milliseconds.
        [[nodiscard]] double FrameTimeMs() const;

        /// Accumulated diagnostics.
        [[nodiscard]] const FrameDiagnostics &GetDiagnostics() const { return m_diagnostics; }

    private:
        Clock::TimePoint m_lastTime{};
        uint64_t m_deltaNs{0};
        uint64_t m_elapsedNs{0};
        uint64_t m_frameNumber{0};

        double m_smoothedFPS{0.0};
        FrameDiagnostics m_diagnostics{};

        // Accumulator for average FPS calculation
        uint64_t m_fpsAccumNs{0};
        uint64_t m_fpsFrameCount{0};
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_FRAME_TIMER_HPP
