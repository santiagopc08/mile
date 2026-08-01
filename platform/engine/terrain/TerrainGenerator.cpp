#include "engine/terrain/TerrainGenerator.hpp"
#include <cmath>
#include <algorithm>

namespace platform
{
    TerrainGenerator::TerrainGenerator(const TerrainConfig &config)
        : m_config(config)
    {
    }

    float TerrainGenerator::CatmullRom(float p0, float p1, float p2, float p3, float t)
    {
        float t2 = t * t;
        float t3 = t2 * t;

        return 0.5f * ((2.0f * p1) +
                       (-p0 + p2) * t +
                       (2.0f * p0 - 5.0f * p1 + 4.0f * p2 - p3) * t2 +
                       (-p0 + 3.0f * p1 - 3.0f * p2 + p3) * t3);
    }

    float TerrainGenerator::CatmullRomDerivative(float p0, float p1, float p2, float p3, float t)
    {
        float t2 = t * t;

        return 0.5f * ((-p0 + p2) +
                       2.0f * (2.0f * p0 - 5.0f * p1 + 4.0f * p2 - p3) * t +
                       3.0f * (-p0 + 3.0f * p1 - 3.0f * p2 + p3) * t2);
    }

    float TerrainGenerator::EvaluateNoise(float x) const
    {
        float total = 0.0f;
        float freq = m_config.BaseFrequency;
        float amp = m_config.Amplitude;

        for (int i = 0; i < m_config.Octaves; ++i)
        {
            float seedOffset = static_cast<float>(m_config.GenerationSeed + i * 1013);
            total += std::sin((x + seedOffset) * freq) * amp;
            freq *= m_config.Lacunarity;
            amp *= m_config.Persistence;
        }

        return m_config.BaseHeight + total;
    }

    HeightSample TerrainGenerator::SampleHeight(float worldX) const
    {
        float stepSize = 50.0f;
        float nodeIdx = worldX / stepSize;
        int i1 = static_cast<int>(std::floor(nodeIdx));
        float t = nodeIdx - static_cast<float>(i1);

        int i0 = i1 - 1;
        int i2 = i1 + 1;
        int i3 = i1 + 2;

        float p0 = EvaluateNoise(static_cast<float>(i0) * stepSize);
        float p1 = EvaluateNoise(static_cast<float>(i1) * stepSize);
        float p2 = EvaluateNoise(static_cast<float>(i2) * stepSize);
        float p3 = EvaluateNoise(static_cast<float>(i3) * stepSize);

        HeightSample sample;
        sample.Height = CatmullRom(p0, p1, p2, p3, t);

        float dy_dt = CatmullRomDerivative(p0, p1, p2, p3, t);
        sample.Slope = dy_dt / stepSize;

        // Compute 2D surface normal perpendicular to tangent vector (1, slope)
        glm::vec2 tangent(1.0f, sample.Slope);
        glm::vec2 normal(-tangent.y, tangent.x);
        sample.Normal = glm::normalize(normal);
        sample.Valid = true;

        return sample;
    }
}
