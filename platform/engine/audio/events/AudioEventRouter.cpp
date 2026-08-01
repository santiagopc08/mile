#include "engine/audio/events/AudioEventRouter.hpp"
#include "engine/audio/AudioEngine.hpp"
#include "engine/audio/events/AudioEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AudioEventRouter::AudioEventRouter(AudioEngine *engine)
        : m_engine(engine)
    {
    }

    void AudioEventRouter::Initialize(AudioEngine *engine, EventQueue *eventQueue)
    {
        m_engine = engine;
        if (eventQueue)
        {
            eventQueue->Subscribe([this](const Event &e) {
                HandleEvent(e);
            });
            LOG_INFO("[AudioEventRouter] Subscribed to EventQueue.");
        }
    }

    void AudioEventRouter::HandleEvent(const Event &event)
    {
        if (!m_engine)
        {
            return;
        }

        switch (event.GetEventType())
        {
        case EventType::AudioVehicleStarted:
        {
            const auto &e = static_cast<const VehicleStartedAudioEvent &>(event);
            m_engine->PlaySpatialSound("EngineLoop", e.GetPosition(), AudioBusType::SFX, 1.0f, true);
            break;
        }
        case EventType::AudioJump:
        {
            const auto &e = static_cast<const JumpAudioEvent &>(event);
            m_engine->PlaySpatialSound("JumpSFX", e.GetPosition(), AudioBusType::SFX, 1.0f, false);
            break;
        }
        case EventType::AudioLanding:
        {
            const auto &e = static_cast<const LandingAudioEvent &>(event);
            m_engine->PlaySpatialSound("LandingSFX", e.GetPosition(), AudioBusType::SFX, 1.0f, false);
            break;
        }
        case EventType::AudioCoinCollected:
        {
            const auto &e = static_cast<const CoinCollectedAudioEvent &>(event);
            m_engine->PlaySpatialSound("CoinSFX", e.GetPosition(), AudioBusType::SFX, 1.0f, false);
            break;
        }
        case EventType::AudioFuelCollected:
        {
            const auto &e = static_cast<const FuelCollectedAudioEvent &>(event);
            m_engine->PlaySpatialSound("FuelSFX", e.GetPosition(), AudioBusType::SFX, 1.0f, false);
            break;
        }
        case EventType::AudioCheckpointReached:
        {
            const auto &e = static_cast<const CheckpointReachedAudioEvent &>(event);
            m_engine->PlaySpatialSound("CheckpointSFX", e.GetPosition(), AudioBusType::SFX, 1.0f, false);
            break;
        }
        default:
            break;
        }
    }
}
