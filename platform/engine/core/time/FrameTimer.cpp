#include "engine/core/time/FrameTimer.hpp"
#include <algorithm>

namespace platform
{
    static constexpr double kSmoothingFactor = 0.05;
    static constexpr uint64_t kOneSecondNs = 1'000'000'000ULL;

    FrameTimer::FrameTimer()
    {
        Reset();
    }

    void FrameTimer::Reset()
    {
        m_lastTime = Clock::Now();
        m_deltaNs = 0;
        m_elapsedNs = 0;
        m_frameNumber = 0;
        m_smoothedFPS = 0.0;
        m_fpsAccumNs = 0;
        m_fpsFrameCount = 0;
        m_diagnostics = FrameDiagnostics{};
    }

    void FrameTimer::Tick()
    {
        auto now = Clock::Now();
        m_deltaNs = Clock::NanosecondsBetween(m_lastTime, now);
        m_lastTime = now;
        m_elapsedNs += m_deltaNs;
        m_frameNumber++;

        // Instantaneous FPS
        double instantFPS = (m_deltaNs > 0)
            ? static_cast<double>(kOneSecondNs) / static_cast<double>(m_deltaNs)
            : 0.0;

        // Exponential moving average for smoothed FPS
        if (m_frameNumber <= 1)
        {
            m_smoothedFPS = instantFPS;
        }
        else
        {
            m_smoothedFPS = m_smoothedFPS * (1.0 - kSmoothingFactor) + instantFPS * kSmoothingFactor;
        }

        // Diagnostics
        double frameMs = FrameTimeMs();
        m_diagnostics.FPS = instantFPS;
        m_diagnostics.BestFrameTimeMs = std::min(m_diagnostics.BestFrameTimeMs, frameMs);
        m_diagnostics.WorstFrameTimeMs = std::max(m_diagnostics.WorstFrameTimeMs, frameMs);

        // Average FPS (rolling per second)
        m_fpsAccumNs += m_deltaNs;
        m_fpsFrameCount++;
        if (m_fpsAccumNs >= kOneSecondNs)
        {
            m_diagnostics.AverageFPS = static_cast<double>(m_fpsFrameCount) *
                static_cast<double>(kOneSecondNs) / static_cast<double>(m_fpsAccumNs);
            m_diagnostics.AverageFrameTimeMs =
                static_cast<double>(m_fpsAccumNs) / (static_cast<double>(m_fpsFrameCount) * 1'000'000.0);
            m_fpsAccumNs = 0;
            m_fpsFrameCount = 0;
        }
    }

    double FrameTimer::DeltaTime() const
    {
        return static_cast<double>(m_deltaNs) / static_cast<double>(kOneSecondNs);
    }

    double FrameTimer::ElapsedTime() const
    {
        return static_cast<double>(m_elapsedNs) / static_cast<double>(kOneSecondNs);
    }

    double FrameTimer::FPS() const
    {
        return (m_deltaNs > 0)
            ? static_cast<double>(kOneSecondNs) / static_cast<double>(m_deltaNs)
            : 0.0;
    }

    double FrameTimer::FrameTimeMs() const
    {
        return static_cast<double>(m_deltaNs) / 1'000'000.0;
    }
}
