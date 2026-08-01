#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_TIMELINE_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_TIMELINE_SYSTEM_HPP

#include "engine/gameplay/checkpoints/CheckpointSettingsComponent.hpp"
#include "engine/gameplay/checkpoints/CheckpointRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class CheckpointTimelineSystem
    {
    public:
        CheckpointTimelineSystem() = default;

        void activateCheckpoint(Registry &registry, EntityID cpEntity, uint64_t tick, double timelinePos, const glm::vec2 &playerPos);
        bool restoreCheckpoint(Registry &registry, EntityID cpEntity, uint64_t &outTick, double &outTimelinePos, glm::vec2 &outPlayerPos);

        [[nodiscard]] bool isActive(Registry &registry, EntityID cpEntity) const;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINTS_CHECKPOINT_TIMELINE_SYSTEM_HPP
