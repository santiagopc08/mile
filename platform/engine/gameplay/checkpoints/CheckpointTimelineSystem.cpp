#include "engine/gameplay/checkpoints/CheckpointTimelineSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void CheckpointTimelineSystem::activateCheckpoint(Registry &registry, EntityID cpEntity, uint64_t tick, double timelinePos, const glm::vec2 &playerPos)
    {
        auto *settings = registry.GetComponent<CheckpointSettingsComponent>(cpEntity);
        auto *runtime = registry.GetComponent<CheckpointRuntimeComponent>(cpEntity);

        if (!settings) settings = &registry.AddComponent<CheckpointSettingsComponent>(cpEntity);
        if (!runtime) runtime = &registry.AddComponent<CheckpointRuntimeComponent>(cpEntity);

        runtime->active = true;
        runtime->simulationTick = tick;
        runtime->timelinePosition = timelinePos;
        runtime->savedPlayerPosition = playerPos;

        LOG_INFO("[CheckpointTimelineSystem] Activated checkpoint ID {} on entity #{} (Tick: {}, TimelinePos: {:.2f}s, PlayerPos: ({:.1f}, {:.1f})).",
                 settings->checkpointID, cpEntity, tick, timelinePos, playerPos.x, playerPos.y);
    }

    bool CheckpointTimelineSystem::restoreCheckpoint(Registry &registry, EntityID cpEntity, uint64_t &outTick, double &outTimelinePos, glm::vec2 &outPlayerPos)
    {
        auto *runtime = registry.GetComponent<CheckpointRuntimeComponent>(cpEntity);

        if (!runtime || !runtime->active) return false;

        outTick = runtime->simulationTick;
        outTimelinePos = runtime->timelinePosition;
        outPlayerPos = runtime->savedPlayerPosition;

        LOG_INFO("[CheckpointTimelineSystem] Restored state from checkpoint on entity #{}.", cpEntity);
        return true;
    }

    bool CheckpointTimelineSystem::isActive(Registry &registry, EntityID cpEntity) const
    {
        auto *runtime = registry.GetComponent<CheckpointRuntimeComponent>(cpEntity);
        return runtime ? runtime->active : false;
    }
}
