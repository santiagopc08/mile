#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_ENGINE_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_ENGINE_HPP

#include "engine/audio/AudioConfiguration.hpp"
#include "engine/audio/AudioDevice.hpp"
#include "engine/audio/AudioManager.hpp"
#include "engine/audio/AudioListener.hpp"
#include "engine/audio/assets/AudioBank.hpp"
#include "engine/audio/bus/AudioBusSystem.hpp"
#include "engine/audio/music/MusicSystem.hpp"
#include "engine/audio/settings/AudioSettings.hpp"
#include "engine/audio/events/AudioEventRouter.hpp"
#include "engine/audio/debug/AudioDiagnostics.hpp"
#include "engine/audio/debug/AudioDebugOverlay.hpp"
#include "engine/events/EventQueue.hpp"
#include "engine/graphics/Renderer.hpp"
#include <memory>

namespace platform
{
    class AudioEngine
    {
    public:
        AudioEngine();
        ~AudioEngine();

        bool Initialize(const AudioConfiguration &config = AudioConfiguration{}, EventQueue *eventQueue = nullptr);
        void Shutdown();

        void Update(double dt);
        void RenderDebug(Renderer &renderer);

        // High level playback API
        AudioSource *PlaySound(const std::string &soundName, AudioBusType bus = AudioBusType::SFX, float volume = 1.0f, bool loop = false);
        AudioSource *PlaySpatialSound(const std::string &soundName, const glm::vec2 &position, AudioBusType bus = AudioBusType::SFX, float volume = 1.0f, bool loop = false);

        // Listener
        void SetListenerPosition(const glm::vec2 &position) { m_listener.SetPosition(position); }
        [[nodiscard]] const AudioListener &GetListener() const { return m_listener; }
        [[nodiscard]] AudioListener &GetListener() { return m_listener; }

        // Accessors
        [[nodiscard]] AudioBank &GetAudioBank() { return m_audioBank; }
        [[nodiscard]] AudioBusSystem &GetBusSystem() { return m_busSystem; }
        [[nodiscard]] MusicSystem &GetMusicSystem() { return m_musicSystem; }
        [[nodiscard]] AudioSettings &GetSettings() { return m_settings; }
        [[nodiscard]] AudioDiagnostics GetDiagnostics() const;
        [[nodiscard]] bool IsInitialized() const { return m_initialized; }

        void ToggleDebugOverlay() { m_debugOverlay.ToggleOverlay(); }

    private:
        AudioConfiguration m_config{};
        AudioDevice m_device;
        AudioManager m_manager;
        AudioListener m_listener;
        AudioBank m_audioBank;
        AudioBusSystem m_busSystem;
        MusicSystem m_musicSystem;
        AudioSettings m_settings;
        AudioEventRouter m_eventRouter;
        AudioDebugOverlay m_debugOverlay;

        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_ENGINE_HPP
