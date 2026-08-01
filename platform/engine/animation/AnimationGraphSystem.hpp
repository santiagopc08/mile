#ifndef PLATFORM_ENGINE_ANIMATION_ANIMATION_GRAPH_SYSTEM_HPP
#define PLATFORM_ENGINE_ANIMATION_ANIMATION_GRAPH_SYSTEM_HPP

#include "engine/animation/AnimationGraphSettingsComponent.hpp"
#include "engine/animation/AnimationGraphRuntimeComponent.hpp"
#include "engine/animation/AnimationControllerComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class AnimationGraphSystem : public IRuntimeProfiler
    {
    public:
        AnimationGraphSystem() = default;

        void play(Registry &registry, EntityID entity);
        void stop(Registry &registry, EntityID entity);
        void pause(Registry &registry, EntityID entity);
        void resume(Registry &registry, EntityID entity);

        void setParameter(Registry &registry, EntityID entity, const std::string &paramName, const AnimParamValue &value);
        void trigger(Registry &registry, EntityID entity, const std::string &triggerName);
        void setPlaybackSpeed(Registry &registry, EntityID entity, float speed);

        void Update(Registry &registry, double dt);

        [[nodiscard]] AnimationStateID currentState(Registry &registry, EntityID entity) const;
        [[nodiscard]] float normalizedTime(Registry &registry, EntityID entity) const;
        [[nodiscard]] bool isTransitioning(Registry &registry, EntityID entity) const;
        [[nodiscard]] std::string activeAnimation(Registry &registry, EntityID entity) const;
        [[nodiscard]] uint32_t currentFrame(Registry &registry, EntityID entity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_ANIMATION_ANIMATION_GRAPH_SYSTEM_HPP
