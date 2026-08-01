#ifndef PLATFORM_ENGINE_AUDIO_EVENTS_AUDIO_EVENTS_HPP
#define PLATFORM_ENGINE_AUDIO_EVENTS_AUDIO_EVENTS_HPP

#include "engine/events/Event.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class VehicleStartedAudioEvent : public Event
    {
    public:
        explicit VehicleStartedAudioEvent(glm::vec2 position = {0.0f, 0.0f})
            : m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioVehicleStarted; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "VehicleStartedAudioEvent"; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

    private:
        glm::vec2 m_position;
    };

    class VehicleStoppedAudioEvent : public Event
    {
    public:
        VehicleStoppedAudioEvent() = default;

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioVehicleStopped; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "VehicleStoppedAudioEvent"; }
    };

    class JumpAudioEvent : public Event
    {
    public:
        explicit JumpAudioEvent(glm::vec2 position = {0.0f, 0.0f})
            : m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioJump; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "JumpAudioEvent"; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

    private:
        glm::vec2 m_position;
    };

    class LandingAudioEvent : public Event
    {
    public:
        explicit LandingAudioEvent(float impactSpeed, glm::vec2 position = {0.0f, 0.0f})
            : m_impactSpeed(impactSpeed), m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioLanding; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "LandingAudioEvent"; }
        [[nodiscard]] float GetImpactSpeed() const { return m_impactSpeed; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

    private:
        float m_impactSpeed{0.0f};
        glm::vec2 m_position;
    };

    class CoinCollectedAudioEvent : public Event
    {
    public:
        explicit CoinCollectedAudioEvent(glm::vec2 position = {0.0f, 0.0f})
            : m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioCoinCollected; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "CoinCollectedAudioEvent"; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

    private:
        glm::vec2 m_position;
    };

    class FuelCollectedAudioEvent : public Event
    {
    public:
        explicit FuelCollectedAudioEvent(glm::vec2 position = {0.0f, 0.0f})
            : m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioFuelCollected; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "FuelCollectedAudioEvent"; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

    private:
        glm::vec2 m_position;
    };

    class CheckpointReachedAudioEvent : public Event
    {
    public:
        explicit CheckpointReachedAudioEvent(glm::vec2 position = {0.0f, 0.0f})
            : m_position(position) {}

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioCheckpointReached; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "CheckpointReachedAudioEvent"; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

    private:
        glm::vec2 m_position;
    };

    class VehicleResetAudioEvent : public Event
    {
    public:
        VehicleResetAudioEvent() = default;

        [[nodiscard]] EventType GetEventType() const override { return EventType::AudioVehicleReset; }
        [[nodiscard]] EventCategory GetCategory() const override { return EventCategory::Audio; }
        [[nodiscard]] std::string_view GetName() const override { return "VehicleResetAudioEvent"; }
    };
}

#endif // PLATFORM_ENGINE_AUDIO_EVENTS_AUDIO_EVENTS_HPP
