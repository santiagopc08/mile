#include "engine/core/Time.hpp"

namespace platform
{
    Time::Time() = default;

    void Time::Update(double deltaTime)
    {
        m_deltaTime = deltaTime;
        m_elapsedTime += deltaTime;
        m_frameCounter++;

        m_fpsAccumulator += deltaTime;
        m_fpsFrameCount++;

        if (m_fpsAccumulator >= 1.0)
        {
            m_fps = static_cast<double>(m_fpsFrameCount) / m_fpsAccumulator;
            m_fpsAccumulator = 0.0;
            m_fpsFrameCount = 0;
        }
    }
}
