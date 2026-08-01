#ifndef PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_EVENTS_HPP
#define PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/gameplay/GameState.hpp"

namespace platform
{
    class GameStartedEvent : public Event
    {
    public:
        explicit GameStartedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "GameStartedEvent"; }
    };

    class GamePausedEvent : public Event
    {
    public:
        explicit GamePausedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "GamePausedEvent"; }
    };

    class GameResumedEvent : public Event
    {
    public:
        explicit GameResumedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "GameResumedEvent"; }
    };

    class PlayerRespawnedEvent : public Event
    {
    public:
        explicit PlayerRespawnedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "PlayerRespawnedEvent"; }
    };

    class GameCompletedEvent : public Event
    {
    public:
        explicit GameCompletedEvent(uint64_t timestamp = 0) : Event(timestamp) {}
        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "GameCompletedEvent"; }
    };

    class GameplayStateChangedEvent : public Event
    {
    public:
        MatchState PreviousState;
        MatchState NewState;

        GameplayStateChangedEvent(MatchState previousState, MatchState newState, uint64_t timestamp = 0)
            : Event(timestamp), PreviousState(previousState), NewState(newState) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "GameplayStateChangedEvent"; }
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_GAMEPLAY_EVENTS_HPP
