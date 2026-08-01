#ifndef PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_SYSTEM_HPP
#define PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_SYSTEM_HPP

#include "engine/level/progression/ProgressionSettingsComponent.hpp"
#include "engine/level/progression/ProgressionRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class ProgressionSystem
    {
    public:
        ProgressionSystem() = default;

        void unlock(Registry &registry, EntityID entity, LevelID levelID);
        void complete(Registry &registry, EntityID entity, LevelID levelID);

        void saveProgress(Registry &registry, EntityID entity);
        void loadProgress(Registry &registry, EntityID entity);

        [[nodiscard]] bool isUnlocked(Registry &registry, EntityID entity, LevelID levelID) const;
        [[nodiscard]] float completionPercentage(Registry &registry, EntityID entity) const;
    };
}

#endif // PLATFORM_ENGINE_LEVEL_PROGRESSION_PROGRESSION_SYSTEM_HPP
