#ifndef PLATFORM_ENGINE_EVENTS_EVENT_CATEGORY_HPP
#define PLATFORM_ENGINE_EVENTS_EVENT_CATEGORY_HPP

namespace platform
{
    enum class EventCategory
    {
        None = 0,
        Application,
        Window,
        Input,
        Scene,
        Physics,
        Audio,
        UI,
        Resource,
        System,
        Debug
    };
}

#endif // PLATFORM_ENGINE_EVENTS_EVENT_CATEGORY_HPP
