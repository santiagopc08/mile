#ifndef PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_EVENTS_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/gameplay/collectibles/CollectibleComponent.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class CollectibleCollectedEvent : public Event
    {
    public:
        CollectibleCollectedEvent(CollectibleType type, float value, glm::vec2 position, uint64_t timestamp = 0)
            : Event(timestamp), m_type(type), m_value(value), m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Application; }
        [[nodiscard]] std::string_view GetName() const override { return "CollectibleCollectedEvent"; }

        [[nodiscard]] CollectibleType GetCollectibleType() const { return m_type; }
        [[nodiscard]] float GetValue() const { return m_value; }
        [[nodiscard]] glm::vec2 GetPosition() const { return m_position; }

    private:
        CollectibleType m_type;
        float m_value;
        glm::vec2 m_position;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_EVENTS_HPP
