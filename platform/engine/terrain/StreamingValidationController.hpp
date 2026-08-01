#ifndef PLATFORM_ENGINE_TERRAIN_STREAMING_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TERRAIN_STREAMING_VALIDATION_CONTROLLER_HPP

#include "engine/terrain/StreamingSystem.hpp"
#include "engine/terrain/ChunkManager.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class StreamingValidationState
    {
        SpawnVehicle,
        DriveContinuously,
        LoadNewChunks,
        UnloadOldChunks,
        ReverseDirection,
        Repeat
    };

    class StreamingValidationController
    {
    public:
        StreamingValidationController() = default;

        void Initialize();
        void Update(Registry &registry, ChunkManager &chunkManager, StreamingSystem &streamingSystem, EntityID vehicleEntity, uint64_t seed, double dt);

        [[nodiscard]] StreamingValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        StreamingValidationState m_state{StreamingValidationState::SpawnVehicle};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_STREAMING_VALIDATION_CONTROLLER_HPP
