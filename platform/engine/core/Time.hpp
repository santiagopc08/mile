#ifndef PLATFORM_ENGINE_CORE_TIME_HPP
#define PLATFORM_ENGINE_CORE_TIME_HPP

#include <cstdint>

namespace platform
{
    class Time
    {
    public:
        Time();

        void Update(double deltaTime);

        [[nodiscard]] double GetDeltaTime() const { return m_deltaTime; }
        [[nodiscard]] double GetElapsedTime() const { return m_elapsedTime; }
        [[nodiscard]] uint64_t GetFrameCounter() const { return m_frameCounter; }
        [[nodiscard]] double GetFPS() const { return m_fps; }

    private:
        double m_deltaTime{0.0};
        double m_elapsedTime{0.0};
        uint64_t m_frameCounter{0};
        double m_fps{0.0};
        double m_fpsAccumulator{0.0};
        uint32_t m_fpsFrameCount{0};
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_HPP
