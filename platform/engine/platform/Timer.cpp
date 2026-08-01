#include "engine/platform/Timer.hpp"
#include <SDL3/SDL.h>

namespace platform
{
    Timer::Timer()
    {
        m_frequency = SDL_GetPerformanceFrequency();
        Reset();
    }

    void Timer::Reset()
    {
        m_lastCounter = SDL_GetPerformanceCounter();
        m_deltaTime = 0.0;
        m_elapsedTime = 0.0;
    }

    void Timer::Tick()
    {
        uint64_t currentCounter = SDL_GetPerformanceCounter();
        uint64_t diff = currentCounter - m_lastCounter;
        m_lastCounter = currentCounter;

        m_deltaTime = static_cast<double>(diff) / static_cast<double>(m_frequency);
        m_elapsedTime += m_deltaTime;
    }

    uint64_t Timer::GetTicksNanoseconds() const
    {
        return SDL_GetTicksNS();
    }

    uint64_t Timer::GetTicksMilliseconds() const
    {
        return SDL_GetTicks();
    }
}
