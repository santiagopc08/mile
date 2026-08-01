#ifndef PLATFORM_ENGINE_EVENTS_EVENT_QUEUE_HPP
#define PLATFORM_ENGINE_EVENTS_EVENT_QUEUE_HPP

#include "engine/events/Event.hpp"
#include <vector>
#include <memory>
#include <functional>

namespace platform
{
    using EventCallbackFn = std::function<void(const Event &)>;

    struct EventDiagnostics
    {
        uint64_t TotalGenerated{0};
        uint64_t TotalProcessed{0};
        size_t QueueDepth{0};
        double ProcessingTimeMs{0.0};
    };

    class EventQueue
    {
    public:
        EventQueue();

        void Push(std::shared_ptr<Event> event);
        void DispatchImmediate(const Event &event);

        void ProcessEvents();
        void Subscribe(EventCallbackFn callback);

        [[nodiscard]] const EventDiagnostics &GetDiagnostics() const { return m_diagnostics; }

    private:
        std::vector<std::shared_ptr<Event>> m_readQueue;
        std::vector<std::shared_ptr<Event>> m_writeQueue;
        std::vector<EventCallbackFn> m_subscribers;
        EventDiagnostics m_diagnostics;
    };
}

#endif // PLATFORM_ENGINE_EVENTS_EVENT_QUEUE_HPP
