#include "engine/level/npc/NPCSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool NPCSystem::interact(Registry &registry, EntityID npcEntity, EntityID playerEntity)
    {
        auto *settings = registry.GetComponent<NPCSettingsComponent>(npcEntity);
        auto *runtime = registry.GetComponent<NPCRuntimeComponent>(npcEntity);

        if (!settings) settings = &registry.AddComponent<NPCSettingsComponent>(npcEntity);
        if (!runtime) runtime = &registry.AddComponent<NPCRuntimeComponent>(npcEntity);

        if (!settings->interactable) return false;

        if (runtime->state == NPCState::Idle)
        {
            beginConversation(registry, npcEntity, playerEntity);
            return true;
        }
        return false;
    }

    void NPCSystem::beginConversation(Registry &registry, EntityID npcEntity, EntityID playerEntity)
    {
        auto *runtime = registry.GetComponent<NPCRuntimeComponent>(npcEntity);
        if (!runtime) runtime = &registry.AddComponent<NPCRuntimeComponent>(npcEntity);

        runtime->state = NPCState::Talking;
        runtime->interactingPlayer = playerEntity;
        LOG_INFO("[NPCSystem] NPC #{} began conversation with player #{}.", npcEntity, playerEntity);
    }

    void NPCSystem::endConversation(Registry &registry, EntityID npcEntity)
    {
        auto *runtime = registry.GetComponent<NPCRuntimeComponent>(npcEntity);
        if (runtime)
        {
            runtime->state = NPCState::Idle;
            runtime->interactingPlayer = kNullEntity;
            LOG_INFO("[NPCSystem] NPC #{} ended conversation.", npcEntity);
        }
    }

    void NPCSystem::setState(Registry &registry, EntityID npcEntity, NPCState state)
    {
        auto *runtime = registry.GetComponent<NPCRuntimeComponent>(npcEntity);
        if (!runtime) runtime = &registry.AddComponent<NPCRuntimeComponent>(npcEntity);
        runtime->state = state;
    }

    NPCState NPCSystem::state(Registry &registry, EntityID npcEntity) const
    {
        auto *runtime = registry.GetComponent<NPCRuntimeComponent>(npcEntity);
        return runtime ? runtime->state : NPCState::Idle;
    }

    EntityID NPCSystem::interactingPlayer(Registry &registry, EntityID npcEntity) const
    {
        auto *runtime = registry.GetComponent<NPCRuntimeComponent>(npcEntity);
        return runtime ? runtime->interactingPlayer : kNullEntity;
    }
}
