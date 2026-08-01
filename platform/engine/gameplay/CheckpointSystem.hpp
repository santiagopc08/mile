#ifndef PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_SYSTEM_HPP

#include "engine/gameplay/CheckpointSettingsComponent.hpp"
#include "engine/gameplay/CheckpointRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/events/EventQueue.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class CheckpointSystem
    {
    public:
        CheckpointSystem();

        void activate(Registry &registry, EntityID checkpointEntity);
        void deactivate(Registry &registry, EntityID checkpointEntity);
        [[nodiscard]] glm::vec2 lastCheckpoint() const { return m_latestCheckpointPosition; }
        void restore(Registry &registry, EntityID playerEntity);

        void Update(Registry &registry, EntityID playerEntity, EventQueue *eventQueue);

        [[nodiscard]] int GetLastActivatedSequence() const { return m_lastActivatedSequence; }
        [[nodiscard]] glm::vec2 GetLatestCheckpointPosition() const { return m_latestCheckpointPosition; }

    private:
        int m_lastActivatedSequence{0};
        glm::vec2 m_latestCheckpointPosition{0.0f, 0.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_CHECKPOINT_SYSTEM_HPP
