#ifndef PLATFORM_ENGINE_LEVEL_NPC_NPC_SYSTEM_HPP
#define PLATFORM_ENGINE_LEVEL_NPC_NPC_SYSTEM_HPP

#include "engine/level/npc/NPCSettingsComponent.hpp"
#include "engine/level/npc/NPCRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class NPCSystem
    {
    public:
        NPCSystem() = default;

        bool interact(Registry &registry, EntityID npcEntity, EntityID playerEntity);
        void beginConversation(Registry &registry, EntityID npcEntity, EntityID playerEntity);
        void endConversation(Registry &registry, EntityID npcEntity);

        void setState(Registry &registry, EntityID npcEntity, NPCState state);

        [[nodiscard]] NPCState state(Registry &registry, EntityID npcEntity) const;
        [[nodiscard]] EntityID interactingPlayer(Registry &registry, EntityID npcEntity) const;
    };
}

#endif // PLATFORM_ENGINE_LEVEL_NPC_NPC_SYSTEM_HPP
