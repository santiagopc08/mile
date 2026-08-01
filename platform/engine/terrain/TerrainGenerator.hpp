#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_GENERATOR_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_GENERATOR_HPP

#include "engine/terrain/TerrainConfig.hpp"
#include "engine/terrain/TerrainQuery.hpp"
#include <vector>

namespace platform
{
    class TerrainGenerator
    {
    public:
        explicit TerrainGenerator(const TerrainConfig &config = TerrainConfig{});

        void SetConfig(const TerrainConfig &config) { m_config = config; }
        [[nodiscard]] const TerrainConfig &GetConfig() const { return m_config; }

        [[nodiscard]] HeightSample SampleHeight(float worldX) const;
        [[nodiscard]] float GetHeight(float worldX) const { return SampleHeight(worldX).Height; }
        [[nodiscard]] float GetSlope(float worldX) const { return SampleHeight(worldX).Slope; }
        [[nodiscard]] glm::vec2 GetNormal(float worldX) const { return SampleHeight(worldX).Normal; }

        static float CatmullRom(float p0, float p1, float p2, float p3, float t);
        static float CatmullRomDerivative(float p0, float p1, float p2, float p3, float t);

    private:
        [[nodiscard]] float EvaluateNoise(float x) const;

        TerrainConfig m_config;
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_GENERATOR_HPP
