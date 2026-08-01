#ifndef PLATFORM_ENGINE_AI_AI_SYSTEM_HPP
#define PLATFORM_ENGINE_AI_AI_SYSTEM_HPP

#include "engine/ai/AISettingsComponent.hpp"
#include "engine/ai/AIRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class AISystem
    {
    public:
        AISystem() = default;

        void setBehavior(Registry &registry, EntityID entity, AIState state);
        void setTarget(Registry &registry, EntityID entity, EntityID targetEntity);
        void clearTarget(Registry &registry, EntityID entity);

        void pauseAI(Registry &registry, EntityID entity);
        void resumeAI(Registry &registry, EntityID entity);

        [[nodiscard]] AIState currentState(Registry &registry, EntityID entity) const;
        [[nodiscard]] EntityID target(Registry &registry, EntityID entity) const;
        [[nodiscard]] bool isPaused(Registry &registry, EntityID entity) const;
    };
}

#endif // PLATFORM_ENGINE_AI_AI_SYSTEM_HPP
