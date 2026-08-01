#include "engine/core/time/Stopwatch.hpp"

namespace platform
{
    Stopwatch::Stopwatch() = default;

    void Stopwatch::Start()
    {
        if (!m_running)
        {
            m_startTime = Clock::Now();
            m_running = true;
        }
    }

    void Stopwatch::Stop()
    {
        if (m_running)
        {
            m_accumulatedNs += Clock::NanosecondsBetween(m_startTime, Clock::Now());
            m_running = false;
        }
    }

    void Stopwatch::Reset()
    {
        m_accumulatedNs = 0;
        m_running = false;
    }

    void Stopwatch::Restart()
    {
        m_accumulatedNs = 0;
        m_startTime = Clock::Now();
        m_running = true;
    }

    uint64_t Stopwatch::ElapsedNanoseconds() const
    {
        uint64_t total = m_accumulatedNs;
        if (m_running)
        {
            total += Clock::NanosecondsBetween(m_startTime, Clock::Now());
        }
        return total;
    }

    uint64_t Stopwatch::ElapsedMicroseconds() const
    {
        return ElapsedNanoseconds() / 1'000ULL;
    }

    double Stopwatch::ElapsedMilliseconds() const
    {
        return static_cast<double>(ElapsedNanoseconds()) / 1'000'000.0;
    }

    double Stopwatch::ElapsedSeconds() const
    {
        return static_cast<double>(ElapsedNanoseconds()) / 1'000'000'000.0;
    }
}
