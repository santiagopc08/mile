#include "engine/audio/spatial/SpatialAudio2D.hpp"
#include <algorithm>
#include <cmath>

namespace platform
{
    void SpatialAudio2D::Evaluate(AudioSource &source, const AudioListener &listener)
    {
        if (!source.IsSpatial())
        {
            source.SetEffectiveVolume(source.GetVolume());
            source.SetStereoPan(0.0f);
            return;
        }

        glm::vec2 diff = source.GetPosition() - listener.GetPosition();
        float dist = glm::length(diff);

        float attenuation = CalculateDistanceAttenuation(dist, source.GetMinDistance(), source.GetMaxDistance(), source.GetFalloffMode());
        float pan = CalculateStereoPan(diff.x, source.GetMaxDistance());

        source.SetEffectiveVolume(source.GetVolume() * attenuation);
        source.SetStereoPan(pan);
    }

    float SpatialAudio2D::CalculateDistanceAttenuation(float distance, float minDist, float maxDist, SpatialFalloffMode mode)
    {
        if (distance <= minDist)
        {
            return 1.0f;
        }
        if (distance >= maxDist)
        {
            return 0.0f;
        }

        float factor = (distance - minDist) / (maxDist - minDist);

        if (mode == SpatialFalloffMode::Inverse)
        {
            return minDist / (minDist + factor * (maxDist - minDist));
        }

        // Default Linear falloff
        return 1.0f - factor;
    }

    float SpatialAudio2D::CalculateStereoPan(float dx, float maxDist)
    {
        if (maxDist <= 0.001f)
        {
            return 0.0f;
        }

        float pan = dx / (maxDist * 0.5f);
        return glm::clamp(pan, -1.0f, 1.0f);
    }
}
