#ifndef PLATFORM_ENGINE_TERRAIN_CHUNK_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TERRAIN_CHUNK_VALIDATION_CONTROLLER_HPP

#include "engine/terrain/ChunkManager.hpp"
#include "engine/terrain/TerrainSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class ChunkValidationState
    {
        GenerateWorld,
        ValidateBorders,
        TraverseEveryChunk,
        VerifyContinuity,
        DestroyWorld,
        Regenerate,
        CompareResults,
        Repeat
    };

    class ChunkValidationController
    {
    public:
        ChunkValidationController() = default;

        void Initialize();
        void Update(Registry &registry, ChunkManager &chunkManager, TerrainSystem &terrainSystem, uint64_t seed, double dt);

        [[nodiscard]] ChunkValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        ChunkValidationState m_state{ChunkValidationState::GenerateWorld};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
        bool m_continuityPassed{true};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_CHUNK_VALIDATION_CONTROLLER_HPP
