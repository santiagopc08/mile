#include "engine/gameplay/CheckpointSystem.hpp"
#include "engine/gameplay/CheckpointComponent.hpp"
#include "engine/gameplay/CheckpointEvents.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    CheckpointSystem::CheckpointSystem() = default;

    void CheckpointSystem::activate(Registry &registry, EntityID checkpointEntity)
    {
        auto *rComp = registry.GetComponent<CheckpointRuntimeComponent>(checkpointEntity);
        if (!rComp) rComp = &registry.AddComponent<CheckpointRuntimeComponent>(checkpointEntity);
        rComp->activated = true;

        auto *tComp = registry.GetComponent<TransformComponent>(checkpointEntity);
        if (tComp)
        {
            m_latestCheckpointPosition = tComp->Position;
        }
        LOG_INFO("[CheckpointSystem] Activated checkpoint entity #{}.", checkpointEntity);
    }

    void CheckpointSystem::deactivate(Registry &registry, EntityID checkpointEntity)
    {
        auto *rComp = registry.GetComponent<CheckpointRuntimeComponent>(checkpointEntity);
        if (rComp) rComp->activated = false;
    }

    void CheckpointSystem::restore(Registry &registry, EntityID playerEntity)
    {
        auto *tComp = registry.GetComponent<TransformComponent>(playerEntity);
        if (tComp)
        {
            tComp->Position = m_latestCheckpointPosition;
            LOG_INFO("[CheckpointSystem] Restored player entity #{} to checkpoint position ({:.1f}, {:.1f}).",
                     playerEntity, m_latestCheckpointPosition.x, m_latestCheckpointPosition.y);
        }
    }

    void CheckpointSystem::Update(Registry &registry, EntityID playerEntity, EventQueue *eventQueue)
    {
        auto *playerTransform = registry.GetComponent<TransformComponent>(playerEntity);
        if (!playerTransform)
        {
            return;
        }

        auto view = registry.GetView<TransformComponent, CheckpointComponent, ActiveComponent>();
        view.Each([this, playerTransform, eventQueue](EntityID entity, TransformComponent &transform, CheckpointComponent &cp, ActiveComponent &active) {
            (void)entity;
            if (!active.Enabled || cp.Activated)
            {
                return;
            }

            // Check distance between player and checkpoint
            float dist = glm::distance(playerTransform->Position, transform.Position);
            if (dist <= cp.Radius)
            {
                cp.Activated = true;
                if (cp.Sequence > m_lastActivatedSequence)
                {
                    m_lastActivatedSequence = cp.Sequence;
                    m_latestCheckpointPosition = transform.Position;
                }

                if (eventQueue)
                {
                    eventQueue->Push(std::make_shared<CheckpointReachedEvent>(cp.Sequence, transform.Position));
                }
            }
        });
    }
}
