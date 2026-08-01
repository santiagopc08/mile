#include "engine/core/time/FixedStepTimer.hpp"
#include <algorithm>

namespace platform
{
    static constexpr uint64_t kOneSecondNs = 1'000'000'000ULL;

    FixedStepTimer::FixedStepTimer(double frequencyHz)
    {
        SetFrequency(frequencyHz);
    }

    void FixedStepTimer::SetFrequency(double frequencyHz)
    {
        if (frequencyHz <= 0.0)
        {
            frequencyHz = 60.0;
        }
        m_stepNs = static_cast<uint64_t>(static_cast<double>(kOneSecondNs) / frequencyHz);
    }

    void FixedStepTimer::Reset()
    {
        m_accumulatorNs = 0;
    }

    uint32_t FixedStepTimer::Accumulate(uint64_t frameDeltaNs, const std::function<void(double fixedDt)> &stepCallback)
    {
        m_accumulatorNs += frameDeltaNs;

        double fixedDt = FixedDeltaTime();
        uint32_t steps = 0;

        while (m_accumulatorNs >= m_stepNs && steps < kMaxStepsPerFrame)
        {
            if (stepCallback)
            {
                stepCallback(fixedDt);
            }
            m_accumulatorNs -= m_stepNs;
            steps++;
        }

        // Clamp accumulator to prevent spiral of death
        if (m_accumulatorNs > m_stepNs * kMaxStepsPerFrame)
        {
            m_accumulatorNs = 0;
        }

        return steps;
    }

    double FixedStepTimer::Alpha() const
    {
        if (m_stepNs == 0)
        {
            return 0.0;
        }
        return static_cast<double>(m_accumulatorNs) / static_cast<double>(m_stepNs);
    }

    double FixedStepTimer::FixedDeltaTime() const
    {
        return static_cast<double>(m_stepNs) / static_cast<double>(kOneSecondNs);
    }
}
