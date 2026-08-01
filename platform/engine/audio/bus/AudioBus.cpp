#include "engine/audio/bus/AudioBus.hpp"

namespace platform
{
    AudioBus::AudioBus(AudioBusType type, std::string name, AudioBus *parent)
        : m_type(type), m_name(std::move(name)), m_parent(parent)
    {
    }

    float AudioBus::GetEffectiveVolume() const
    {
        if (m_mute)
        {
            return 0.0f;
        }

        float parentGain = m_parent ? m_parent->GetEffectiveVolume() : 1.0f;
        return m_volume * parentGain;
    }
}
