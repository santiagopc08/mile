#ifndef PLATFORM_ENGINE_EVENTS_APPLICATION_EVENTS_HPP
#define PLATFORM_ENGINE_EVENTS_APPLICATION_EVENTS_HPP

#include "engine/events/Event.hpp"

namespace platform
{
    class ApplicationStartedEvent : public Event
    {
    public:
        explicit ApplicationStartedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::ApplicationStarted; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "ApplicationStartedEvent"; }
    };

    class ApplicationClosingEvent : public Event
    {
    public:
        explicit ApplicationClosingEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::ApplicationClosing; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "ApplicationClosingEvent"; }
    };

    class FrameStartedEvent : public Event
    {
    public:
        explicit FrameStartedEvent(uint64_t frameIndex, uint64_t timestamp = 0)
            : Event(timestamp), m_frameIndex(frameIndex) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::FrameStarted; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "FrameStartedEvent"; }
        [[nodiscard]] uint64_t GetFrameIndex() const { return m_frameIndex; }

    private:
        uint64_t m_frameIndex{0};
    };

    class FrameEndedEvent : public Event
    {
    public:
        explicit FrameEndedEvent(uint64_t frameIndex, uint64_t timestamp = 0)
            : Event(timestamp), m_frameIndex(frameIndex) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::FrameEnded; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "FrameEndedEvent"; }
        [[nodiscard]] uint64_t GetFrameIndex() const { return m_frameIndex; }

    private:
        uint64_t m_frameIndex{0};
    };
}

#endif // PLATFORM_ENGINE_EVENTS_APPLICATION_EVENTS_HPP
