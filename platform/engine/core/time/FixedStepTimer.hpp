#ifndef PLATFORM_ENGINE_CORE_TIME_FIXED_STEP_TIMER_HPP
#define PLATFORM_ENGINE_CORE_TIME_FIXED_STEP_TIMER_HPP

#include <cstdint>
#include <functional>

namespace platform
{
    /// Accumulator-based fixed timestep timer.
    /// Guarantees deterministic update frequency regardless of frame rate.
    class FixedStepTimer
    {
    public:
        /// Construct with target frequency in Hz (default 60).
        explicit FixedStepTimer(double frequencyHz = 60.0);

        /// Accumulate frame delta (in nanoseconds) and invoke callback
        /// for each fixed step that has elapsed.
        /// Returns the number of steps executed.
        uint32_t Accumulate(uint64_t frameDeltaNs, const std::function<void(double fixedDt)> &stepCallback);

        /// Returns the interpolation alpha for rendering between two fixed steps.
        /// Value in [0, 1].
        [[nodiscard]] double Alpha() const;

        /// Returns the fixed timestep in seconds.
        [[nodiscard]] double FixedDeltaTime() const;

        /// Returns the fixed timestep in nanoseconds.
        [[nodiscard]] uint64_t FixedDeltaTimeNs() const { return m_stepNs; }

        /// Set target frequency.
        void SetFrequency(double frequencyHz);

        /// Reset accumulator.
        void Reset();

    private:
        uint64_t m_stepNs{0};
        uint64_t m_accumulatorNs{0};
        static constexpr uint32_t kMaxStepsPerFrame = 5;
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_FIXED_STEP_TIMER_HPP
