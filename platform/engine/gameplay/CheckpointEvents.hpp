#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_EVENTS_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class CheckpointReachedEvent : public Event
    {
    public:
        CheckpointReachedEvent(int sequence, glm::vec2 position, uint64_t timestamp = 0)
            : Event(timestamp), m_sequence(sequence), m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "CheckpointReachedEvent"; }

        [[nodiscard]] int GetSequence() const { return m_sequence; }
        [[nodiscard]] glm::vec2 GetPosition() const { return m_position; }

    private:
        int m_sequence;
        glm::vec2 m_position;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_EVENTS_HPP
