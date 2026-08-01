#include "engine/audio/AudioDevice.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AudioDevice::AudioDevice() = default;

    AudioDevice::~AudioDevice()
    {
        Shutdown();
    }

    bool AudioDevice::Initialize(const AudioConfiguration &config)
    {
        if (m_initialized)
        {
            return true;
        }

        m_config = config;
        m_deviceID = 1; // Primary default audio stream ID
        m_initialized = true;

        LOG_INFO("[AudioDevice] Initialized Audio Device '{}' (Sample Rate: {} Hz, Channels: {}).",
                 m_config.DeviceName, m_config.SampleRate, m_config.Channels);
        return true;
    }

    void AudioDevice::Shutdown()
    {
        if (!m_initialized)
        {
            return;
        }

        m_deviceID = 0;
        m_initialized = false;
        LOG_INFO("[AudioDevice] Audio Device shutdown complete.");
    }

    std::vector<std::string> AudioDevice::GetAvailableDevices()
    {
        return {"Default Audio Output", "System Headphones", "Built-in Speakers"};
    }
}
