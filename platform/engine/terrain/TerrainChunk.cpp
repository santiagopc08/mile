#include "engine/terrain/TerrainChunk.hpp"
#include "engine/terrain/TerrainGenerator.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    TerrainChunk::TerrainChunk(int32_t chunkIndex, float startX, float chunkWidth)
        : m_chunkIndex(chunkIndex), m_startX(startX), m_endX(startX + chunkWidth)
    {
    }

    TerrainChunk::~TerrainChunk() = default;

    void TerrainChunk::Generate(const TerrainGenerator &generator, const TerrainConfig &config)
    {
        m_surfacePoints.clear();
        int resolution = config.ChunkResolution;
        float stepX = (m_endX - m_startX) / static_cast<float>(resolution);

        for (int i = 0; i <= resolution; ++i)
        {
            float x = m_startX + static_cast<float>(i) * stepX;
            float y = generator.GetHeight(x);
            m_surfacePoints.emplace_back(x, y);
        }

        m_state = ChunkState::Generated;
    }

    void TerrainChunk::BuildPhysics(PhysicsWorld &physicsWorld)
    {
        if (m_surfacePoints.empty())
        {
            return;
        }

        TransformComponent t;
        t.SetPosition({0.0f, 0.0f});

        RigidBodyComponent b;
        b.Type = BodyType::Static;

        // Create static body for this terrain chunk
        m_physicsBodyHandle = physicsWorld.CreateBody(0, t, b);
        m_state = ChunkState::PhysicsBuilt;
    }

    void TerrainChunk::DestroyPhysics(PhysicsWorld &physicsWorld)
    {
        if (m_physicsBodyHandle)
        {
            physicsWorld.DestroyBody(m_physicsBodyHandle);
            m_physicsBodyHandle = nullptr;
        }
        m_state = ChunkState::Unloaded;
    }
}
