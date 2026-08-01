#ifndef PLATFORM_ENGINE_AUDIO_EVENTS_AUDIO_EVENT_ROUTER_HPP
#define PLATFORM_ENGINE_AUDIO_EVENTS_AUDIO_EVENT_ROUTER_HPP

#include "engine/events/EventQueue.hpp"

namespace platform
{
    class AudioEngine;

    class AudioEventRouter
    {
    public:
        AudioEventRouter() = default;
        explicit AudioEventRouter(AudioEngine *engine);

        void Initialize(AudioEngine *engine, EventQueue *eventQueue);
        void HandleEvent(const Event &event);

    private:
        AudioEngine *m_engine{nullptr};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_EVENTS_AUDIO_EVENT_ROUTER_HPP
