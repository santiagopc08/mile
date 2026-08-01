#include "engine/events/EventQueue.hpp"
#include <chrono>

namespace platform
{
    EventQueue::EventQueue() = default;

    void EventQueue::Push(std::shared_ptr<Event> event)
    {
        if (!event)
        {
            return;
        }

        m_writeQueue.push_back(std::move(event));
        m_diagnostics.TotalGenerated++;
        m_diagnostics.QueueDepth = m_writeQueue.size();
    }

    void EventQueue::DispatchImmediate(const Event &event)
    {
        for (const auto &subscriber : m_subscribers)
        {
            if (subscriber)
            {
                subscriber(event);
            }
        }
    }

    void EventQueue::Subscribe(EventCallbackFn callback)
    {
        if (callback)
        {
            m_subscribers.push_back(std::move(callback));
        }
    }

    void EventQueue::ProcessEvents()
    {
        auto startTime = std::chrono::high_resolution_clock::now();

        // Swap double-buffered queues
        m_readQueue.clear();
        m_readQueue.swap(m_writeQueue);
        m_diagnostics.QueueDepth = 0;

        for (const auto &event : m_readQueue)
        {
            if (event && !event->IsHandled())
            {
                DispatchImmediate(*event);
                m_diagnostics.TotalProcessed++;
            }
        }

        m_readQueue.clear();

        auto endTime = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> duration = endTime - startTime;
        m_diagnostics.ProcessingTimeMs = duration.count();
    }
}
