#ifndef PLATFORM_ENGINE_LEVEL_LEVEL_SYSTEM_HPP
#define PLATFORM_ENGINE_LEVEL_LEVEL_SYSTEM_HPP

#include "engine/level/LevelSettingsComponent.hpp"
#include "engine/level/LevelRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class LevelSystem : public IRuntimeProfiler
    {
    public:
        LevelSystem() = default;

        bool loadLevel(Registry &registry, EntityID levelEntity, LevelID id, const std::string &name);
        void reloadLevel(Registry &registry, EntityID levelEntity);
        void unloadLevel(Registry &registry, EntityID levelEntity);

        void restartLevel(Registry &registry, EntityID levelEntity);
        void completeLevel(Registry &registry, EntityID levelEntity);

        [[nodiscard]] LevelState levelState(Registry &registry, EntityID levelEntity) const;
        [[nodiscard]] bool isCompleted(Registry &registry, EntityID levelEntity) const;
        [[nodiscard]] float playTime(Registry &registry, EntityID levelEntity) const;

        void Update(Registry &registry, double dt);

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_LEVEL_LEVEL_SYSTEM_HPP
