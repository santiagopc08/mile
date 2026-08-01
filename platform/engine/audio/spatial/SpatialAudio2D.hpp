#ifndef PLATFORM_ENGINE_AUDIO_SPATIAL_SPATIAL_AUDIO_2D_HPP
#define PLATFORM_ENGINE_AUDIO_SPATIAL_SPATIAL_AUDIO_2D_HPP

#include "engine/audio/AudioListener.hpp"
#include "engine/audio/AudioSource.hpp"

namespace platform
{
    class SpatialAudio2D
    {
    public:
        SpatialAudio2D() = default;

        static void Evaluate(AudioSource &source, const AudioListener &listener);
        static float CalculateDistanceAttenuation(float distance, float minDist, float maxDist, SpatialFalloffMode mode);
        static float CalculateStereoPan(float dx, float maxDist);
    };
}

#endif // PLATFORM_ENGINE_AUDIO_SPATIAL_SPATIAL_AUDIO_2D_HPP
