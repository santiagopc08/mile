#ifndef PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SYSTEM_HPP

#include "engine/gameplay/collectibles/CollectibleSettingsComponent.hpp"
#include "engine/gameplay/collectibles/CollectibleRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class CollectibleSystem
    {
    public:
        CollectibleSystem() = default;

        EntityID spawnCollectible(Registry &registry, CollectibleType type, const glm::vec2 &position, float value = 10.0f);
        void collect(Registry &registry, EntityID collectibleEntity);
        void destroyCollectible(Registry &registry, EntityID collectibleEntity);
        void resetCollectible(Registry &registry, EntityID collectibleEntity);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_COLLECTIBLES_COLLECTIBLE_SYSTEM_HPP
