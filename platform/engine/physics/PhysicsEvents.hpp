#ifndef PLATFORM_ENGINE_PHYSICS_PHYSICS_EVENTS_HPP
#define PLATFORM_ENGINE_PHYSICS_PHYSICS_EVENTS_HPP

#include "engine/events/Event.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class CollisionStartedEvent : public Event
    {
    public:
        CollisionStartedEvent(EntityID entityA, EntityID entityB, uint64_t timestamp = 0)
            : Event(timestamp), m_entityA(entityA), m_entityB(entityB) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Physics; }
        [[nodiscard]] std::string_view GetName() const override { return "CollisionStartedEvent"; }

        [[nodiscard]] EntityID GetEntityA() const { return m_entityA; }
        [[nodiscard]] EntityID GetEntityB() const { return m_entityB; }

    private:
        EntityID m_entityA;
        EntityID m_entityB;
    };

    class CollisionEndedEvent : public Event
    {
    public:
        CollisionEndedEvent(EntityID entityA, EntityID entityB, uint64_t timestamp = 0)
            : Event(timestamp), m_entityA(entityA), m_entityB(entityB) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Physics; }
        [[nodiscard]] std::string_view GetName() const override { return "CollisionEndedEvent"; }

        [[nodiscard]] EntityID GetEntityA() const { return m_entityA; }
        [[nodiscard]] EntityID GetEntityB() const { return m_entityB; }

    private:
        EntityID m_entityA;
        EntityID m_entityB;
    };

    class TriggerEnteredEvent : public Event
    {
    public:
        TriggerEnteredEvent(EntityID triggerEntity, EntityID otherEntity, uint64_t timestamp = 0)
            : Event(timestamp), m_triggerEntity(triggerEntity), m_otherEntity(otherEntity) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Physics; }
        [[nodiscard]] std::string_view GetName() const override { return "TriggerEnteredEvent"; }

        [[nodiscard]] EntityID GetTriggerEntity() const { return m_triggerEntity; }
        [[nodiscard]] EntityID GetOtherEntity() const { return m_otherEntity; }

    private:
        EntityID m_triggerEntity;
        EntityID m_otherEntity;
    };

    class TriggerExitedEvent : public Event
    {
    public:
        TriggerExitedEvent(EntityID triggerEntity, EntityID otherEntity, uint64_t timestamp = 0)
            : Event(timestamp), m_triggerEntity(triggerEntity), m_otherEntity(otherEntity) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::None; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Physics; }
        [[nodiscard]] std::string_view GetName() const override { return "TriggerExitedEvent"; }

        [[nodiscard]] EntityID GetTriggerEntity() const { return m_triggerEntity; }
        [[nodiscard]] EntityID GetOtherEntity() const { return m_otherEntity; }

    private:
        EntityID m_triggerEntity;
        EntityID m_otherEntity;
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_PHYSICS_EVENTS_HPP
