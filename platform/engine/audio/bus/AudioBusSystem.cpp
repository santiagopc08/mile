#include "engine/audio/bus/AudioBusSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AudioBusSystem::AudioBusSystem()
    {
        Initialize();
    }

    void AudioBusSystem::Initialize()
    {
        m_buses.clear();

        // Build bus hierarchy: Master is root
        auto master = std::make_unique<AudioBus>(AudioBusType::Master, "Master", nullptr);
        AudioBus *masterPtr = master.get();
        m_buses[AudioBusType::Master] = std::move(master);

        m_buses[AudioBusType::Music] = std::make_unique<AudioBus>(AudioBusType::Music, "Music", masterPtr);
        m_buses[AudioBusType::SFX] = std::make_unique<AudioBus>(AudioBusType::SFX, "SFX", masterPtr);
        m_buses[AudioBusType::UI] = std::make_unique<AudioBus>(AudioBusType::UI, "UI", masterPtr);
        m_buses[AudioBusType::Ambient] = std::make_unique<AudioBus>(AudioBusType::Ambient, "Ambient", masterPtr);

        LOG_INFO("[AudioBusSystem] Hierarchical Audio Bus System initialized (Master, Music, SFX, UI, Ambient).");
    }

    AudioBus *AudioBusSystem::GetBus(AudioBusType type)
    {
        auto it = m_buses.find(type);
        if (it != m_buses.end())
        {
            return it->second.get();
        }
        return nullptr;
    }

    const AudioBus *AudioBusSystem::GetBus(AudioBusType type) const
    {
        auto it = m_buses.find(type);
        if (it != m_buses.end())
        {
            return it->second.get();
        }
        return nullptr;
    }

    void AudioBusSystem::SetBusVolume(AudioBusType type, float volume)
    {
        if (auto *bus = GetBus(type))
        {
            bus->SetVolume(volume);
        }
    }

    void AudioBusSystem::SetBusMute(AudioBusType type, bool mute)
    {
        if (auto *bus = GetBus(type))
        {
            bus->SetMute(mute);
        }
    }

    float AudioBusSystem::GetBusEffectiveVolume(AudioBusType type) const
    {
        if (const auto *bus = GetBus(type))
        {
            return bus->GetEffectiveVolume();
        }
        return 1.0f;
    }
}
