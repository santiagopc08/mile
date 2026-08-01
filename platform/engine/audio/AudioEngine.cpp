#include "engine/audio/AudioEngine.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AudioEngine::AudioEngine() = default;

    AudioEngine::~AudioEngine()
    {
        Shutdown();
    }

    bool AudioEngine::Initialize(const AudioConfiguration &config, EventQueue *eventQueue)
    {
        if (m_initialized)
        {
            return true;
        }

        m_config = config;

        if (!m_device.Initialize(m_config))
        {
            LOG_ERROR("[AudioEngine] Failed to initialize Audio Device.");
            return false;
        }

        m_manager.Initialize(m_config.MaxConcurrentVoices);
        m_busSystem.Initialize();
        m_settings.ApplyToBusSystem(m_busSystem);

        if (eventQueue)
        {
            m_eventRouter.Initialize(this, eventQueue);
        }

        // Register default synthetic test sound clips
        m_audioBank.RegisterSound("EngineLoop", SoundAsset("EngineLoop", AudioSample::CreateSyntheticTone("EngineLoop", 120.0f, 2.0)));
        m_audioBank.RegisterSound("SuspensionSFX", SoundAsset("SuspensionSFX", AudioSample::CreateSyntheticTone("SuspensionSFX", 80.0f, 0.2)));
        m_audioBank.RegisterSound("LandingSFX", SoundAsset("LandingSFX", AudioSample::CreateSyntheticTone("LandingSFX", 60.0f, 0.4)));
        m_audioBank.RegisterSound("CoinSFX", SoundAsset("CoinSFX", AudioSample::CreateSyntheticTone("CoinSFX", 880.0f, 0.15)));
        m_audioBank.RegisterSound("FuelSFX", SoundAsset("FuelSFX", AudioSample::CreateSyntheticTone("FuelSFX", 440.0f, 0.3)));
        m_audioBank.RegisterSound("CheckpointSFX", SoundAsset("CheckpointSFX", AudioSample::CreateSyntheticTone("CheckpointSFX", 523.25f, 0.5)));
        m_audioBank.RegisterSound("JumpSFX", SoundAsset("JumpSFX", AudioSample::CreateSyntheticTone("JumpSFX", 350.0f, 0.25)));

        // Register default music tracks
        m_audioBank.RegisterMusic("MenuTheme", MusicAsset("MenuTheme", AudioSample::CreateSyntheticTone("MenuTheme", 300.0f, 30.0)));
        m_audioBank.RegisterMusic("GameplayTheme", MusicAsset("GameplayTheme", AudioSample::CreateSyntheticTone("GameplayTheme", 400.0f, 60.0)));
        m_audioBank.RegisterMusic("PauseTheme", MusicAsset("PauseTheme", AudioSample::CreateSyntheticTone("PauseTheme", 200.0f, 15.0)));
        m_audioBank.RegisterMusic("GameOverTheme", MusicAsset("GameOverTheme", AudioSample::CreateSyntheticTone("GameOverTheme", 150.0f, 20.0)));

        m_initialized = true;
        LOG_INFO("[AudioEngine] Audio Engine initialized successfully.");
        return true;
    }

    void AudioEngine::Shutdown()
    {
        if (!m_initialized)
        {
            return;
        }

        m_manager.StopAllSounds();
        m_audioBank.UnloadAll();
        m_device.Shutdown();
        m_initialized = false;
        LOG_INFO("[AudioEngine] Audio Engine shutdown complete.");
    }

    void AudioEngine::Update(double dt)
    {
        if (!m_initialized)
        {
            return;
        }

        m_manager.Update(dt, m_listener, m_busSystem);
        m_musicSystem.Update(dt, &m_audioBank);
    }

    void AudioEngine::RenderDebug(Renderer &renderer)
    {
        if (!m_initialized)
        {
            return;
        }

        m_debugOverlay.RenderOverlay(GetDiagnostics(), m_busSystem, m_musicSystem, renderer);
    }

    AudioSource *AudioEngine::PlaySound(const std::string &soundName, AudioBusType bus, float volume, bool loop)
    {
        if (!m_initialized)
        {
            return nullptr;
        }
        return m_manager.PlaySound(soundName, bus, volume, loop);
    }

    AudioSource *AudioEngine::PlaySpatialSound(const std::string &soundName, const glm::vec2 &position, AudioBusType bus, float volume, bool loop)
    {
        if (!m_initialized)
        {
            return nullptr;
        }
        return m_manager.PlaySpatialSound(soundName, position, bus, volume, loop);
    }

    AudioDiagnostics AudioEngine::GetDiagnostics() const
    {
        AudioDiagnostics diag;
        diag.TotalSoundsPlayed = m_manager.GetTotalSoundsPlayed();
        diag.ActiveVoiceCount = m_manager.GetActiveVoiceCount();
        diag.MaxConcurrentVoices = m_config.MaxConcurrentVoices;
        diag.DroppedSounds = 0;
        diag.AverageLatencyMs = 8.0;
        diag.TotalBuses = m_busSystem.GetBuses().size();
        return diag;
    }
}
