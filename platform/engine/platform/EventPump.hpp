#ifndef PLATFORM_ENGINE_PLATFORM_EVENT_PUMP_HPP
#define PLATFORM_ENGINE_PLATFORM_EVENT_PUMP_HPP

#include "engine/events/EventQueue.hpp"
#include "engine/input/Input.hpp"

namespace platform
{
    class EventPump
    {
    public:
        static void Poll(EventQueue &eventQueue, Input &input);
    };
}

#endif // PLATFORM_ENGINE_PLATFORM_EVENT_PUMP_HPP
