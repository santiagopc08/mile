#ifndef PLATFORM_ENGINE_LEVEL_NPC_NPC_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_NPC_NPC_RUNTIME_COMPONENT_HPP

#include "engine/scene/Entity.hpp"

namespace platform
{
    enum class NPCState
    {
        Idle,
        Talking,
        Busy,
        Disabled
    };

    struct NPCRuntimeComponent
    {
        NPCState state{NPCState::Idle};
        EntityID interactingPlayer{kNullEntity};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_NPC_NPC_RUNTIME_COMPONENT_HPP
