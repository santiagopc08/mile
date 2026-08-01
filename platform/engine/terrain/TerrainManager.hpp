#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_MANAGER_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_MANAGER_HPP

#include "engine/terrain/TerrainConfig.hpp"
#include "engine/terrain/TerrainGenerator.hpp"
#include "engine/terrain/TerrainChunk.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include <memory>
#include <unordered_map>

namespace platform
{
    class TerrainManager
    {
    public:
        explicit TerrainManager(const TerrainConfig &config = TerrainConfig{});
        ~TerrainManager();

        void Initialize(const TerrainConfig &config);
        void Shutdown(PhysicsWorld &physicsWorld);

        void UpdateStreaming(const glm::vec2 &cameraPosition, PhysicsWorld &physicsWorld);

        [[nodiscard]] HeightSample SampleHeight(float worldX) const { return m_generator.SampleHeight(worldX); }
        [[nodiscard]] float GetHeight(float worldX) const { return m_generator.GetHeight(worldX); }
        [[nodiscard]] float GetSlope(float worldX) const { return m_generator.GetSlope(worldX); }
        [[nodiscard]] glm::vec2 GetNormal(float worldX) const { return m_generator.GetNormal(worldX); }

        [[nodiscard]] size_t GetLoadedChunkCount() const { return m_chunks.size(); }
        [[nodiscard]] uint32_t GetSeed() const { return m_config.GenerationSeed; }
        [[nodiscard]] const TerrainConfig &GetConfig() const { return m_config; }
        [[nodiscard]] const std::unordered_map<int32_t, std::unique_ptr<TerrainChunk>> &GetChunks() const { return m_chunks; }

    private:
        TerrainConfig m_config;
        TerrainGenerator m_generator;
        std::unordered_map<int32_t, std::unique_ptr<TerrainChunk>> m_chunks;
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_MANAGER_HPP
