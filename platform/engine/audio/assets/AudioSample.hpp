#ifndef PLATFORM_ENGINE_AUDIO_ASSETS_AUDIO_SAMPLE_HPP
#define PLATFORM_ENGINE_AUDIO_ASSETS_AUDIO_SAMPLE_HPP

#include <string>
#include <vector>
#include <cmath>

namespace platform
{
    struct AudioSampleMetadata
    {
        std::string Name{"Sample"};
        double DurationSeconds{1.0};
        uint32_t SampleRate{44100};
        uint8_t Channels{2};
        std::string Format{"PCM 16-bit"};
    };

    class AudioSample
    {
    public:
        AudioSample() = default;

        explicit AudioSample(AudioSampleMetadata metadata)
            : m_metadata(std::move(metadata)) {}

        [[nodiscard]] const AudioSampleMetadata &GetMetadata() const { return m_metadata; }
        [[nodiscard]] double GetDuration() const { return m_metadata.DurationSeconds; }

        static AudioSample CreateSyntheticTone(const std::string &name, float frequencyHz, double durationSec)
        {
            AudioSampleMetadata meta;
            meta.Name = name;
            meta.DurationSeconds = durationSec;
            meta.SampleRate = 44100;
            meta.Channels = 2;
            meta.Format = "Synthetic Sine Wave";

            AudioSample sample(meta);
            size_t totalSamples = static_cast<size_t>(meta.SampleRate * durationSec);
            sample.m_pcmBuffer.reserve(totalSamples * meta.Channels);

            for (size_t i = 0; i < totalSamples; ++i)
            {
                float t = static_cast<float>(i) / static_cast<float>(meta.SampleRate);
                float val = std::sin(2.0f * 3.14159265f * frequencyHz * t);
                sample.m_pcmBuffer.push_back(val); // Left
                sample.m_pcmBuffer.push_back(val); // Right
            }
            return sample;
        }

        [[nodiscard]] const std::vector<float> &GetPCMBuffer() const { return m_pcmBuffer; }

    private:
        AudioSampleMetadata m_metadata{};
        std::vector<float> m_pcmBuffer;
    };
}

#endif // PLATFORM_ENGINE_AUDIO_ASSETS_AUDIO_SAMPLE_HPP
