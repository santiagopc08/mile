#ifndef PLATFORM_ENGINE_PLATFORM_TIMER_HPP
#define PLATFORM_ENGINE_PLATFORM_TIMER_HPP

#include <cstdint>

namespace platform
{
    class Timer
    {
    public:
        Timer();

        void Reset();
        void Tick();

        [[nodiscard]] double GetDeltaTimeSeconds() const { return m_deltaTime; }
        [[nodiscard]] double GetDeltaTimeMilliseconds() const { return m_deltaTime * 1000.0; }
        [[nodiscard]] double GetElapsedTimeSeconds() const { return m_elapsedTime; }
        [[nodiscard]] uint64_t GetTicksNanoseconds() const;
        [[nodiscard]] uint64_t GetTicksMilliseconds() const;

    private:
        uint64_t m_lastCounter{0};
        uint64_t m_frequency{1};
        double m_deltaTime{0.0};
        double m_elapsedTime{0.0};
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_TIMER_HPP
