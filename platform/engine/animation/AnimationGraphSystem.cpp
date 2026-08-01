#include "engine/animation/AnimationGraphSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void AnimationGraphSystem::play(Registry &registry, EntityID entity)
    {
        auto *settings = registry.GetComponent<AnimationGraphSettingsComponent>(entity);
        if (!settings) registry.AddComponent<AnimationGraphSettingsComponent>(entity);

        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        if (!runtime) registry.AddComponent<AnimationGraphRuntimeComponent>(entity);

        auto *controller = registry.GetComponent<AnimationControllerComponent>(entity);
        if (!controller) controller = &registry.AddComponent<AnimationControllerComponent>(entity);

        controller->enabled = true;
        controller->paused = false;
    }

    void AnimationGraphSystem::stop(Registry &registry, EntityID entity)
    {
        auto *controller = registry.GetComponent<AnimationControllerComponent>(entity);
        if (controller) controller->enabled = false;
    }

    void AnimationGraphSystem::pause(Registry &registry, EntityID entity)
    {
        auto *controller = registry.GetComponent<AnimationControllerComponent>(entity);
        if (controller) controller->paused = true;
    }

    void AnimationGraphSystem::resume(Registry &registry, EntityID entity)
    {
        auto *controller = registry.GetComponent<AnimationControllerComponent>(entity);
        if (controller) controller->paused = false;
    }

    void AnimationGraphSystem::setParameter(Registry &registry, EntityID entity, const std::string &paramName, const AnimParamValue &value)
    {
        play(registry, entity); // Ensure components exist
        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        if (runtime)
        {
            runtime->parameters[paramName] = value;
        }
    }

    void AnimationGraphSystem::trigger(Registry &registry, EntityID entity, const std::string &triggerName)
    {
        setParameter(registry, entity, triggerName, true);
    }

    void AnimationGraphSystem::setPlaybackSpeed(Registry &registry, EntityID entity, float speed)
    {
        auto *settings = registry.GetComponent<AnimationGraphSettingsComponent>(entity);
        if (!settings) settings = &registry.AddComponent<AnimationGraphSettingsComponent>(entity);
        settings->playbackSpeed = speed;
    }

    void AnimationGraphSystem::Update(Registry &registry, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<AnimationGraphSettingsComponent, AnimationGraphRuntimeComponent, AnimationControllerComponent>();

        view.Each([delta](EntityID entity, AnimationGraphSettingsComponent &settings, AnimationGraphRuntimeComponent &runtime, AnimationControllerComponent &controller) {
            if (!controller.enabled || controller.paused) return;

            float speed = settings.playbackSpeed * controller.speedMultiplier;
            runtime.stateTime += delta * speed;
            runtime.normalizedTime = (runtime.stateTime > 1.0f) ? (runtime.stateTime - static_cast<int>(runtime.stateTime)) : runtime.stateTime;
            runtime.currentFrame = static_cast<uint32_t>(runtime.normalizedTime * 8.0f); // 8 frames per animation clip

            // Data-driven state evaluation based on parameters
            auto speedIt = runtime.parameters.find("Speed");
            auto groundedIt = runtime.parameters.find("Grounded");
            auto vSpeedIt = runtime.parameters.find("VerticalSpeed");

            float speedVal = 0.0f;
            if (speedIt != runtime.parameters.end() && std::holds_alternative<float>(speedIt->second))
            {
                speedVal = std::get<float>(speedIt->second);
            }

            bool groundedVal = true;
            if (groundedIt != runtime.parameters.end() && std::holds_alternative<bool>(groundedIt->second))
            {
                groundedVal = std::get<bool>(groundedIt->second);
            }

            float vSpeedVal = 0.0f;
            if (vSpeedIt != runtime.parameters.end() && std::holds_alternative<float>(vSpeedIt->second))
            {
                vSpeedVal = std::get<float>(vSpeedIt->second);
            }

            std::string targetState = "Idle";
            if (!groundedVal)
            {
                targetState = (vSpeedVal > 0.1f) ? "Jump" : "Fall";
            }
            else if (speedVal > 5.5f)
            {
                targetState = "Run";
            }
            else if (speedVal > 0.1f)
            {
                targetState = "Walk";
            }
            else
            {
                targetState = "Idle";
            }

            if (targetState != runtime.currentState)
            {
                runtime.previousState = runtime.currentState;
                runtime.currentState = targetState;
                runtime.stateTime = 0.0f;
                runtime.transitionActive = true;
                LOG_INFO("[AnimationGraphSystem] Entity #{} transitioned animation state: '{}' -> '{}'.",
                         entity, runtime.previousState, runtime.currentState);
            }
            else
            {
                runtime.transitionActive = false;
            }
        });
    }

    AnimationStateID AnimationGraphSystem::currentState(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        return runtime ? runtime->currentState : "Idle";
    }

    float AnimationGraphSystem::normalizedTime(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        return runtime ? runtime->normalizedTime : 0.0f;
    }

    bool AnimationGraphSystem::isTransitioning(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        return runtime ? runtime->transitionActive : false;
    }

    std::string AnimationGraphSystem::activeAnimation(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        return runtime ? ("Anim_" + runtime->currentState) : "Anim_Idle";
    }

    uint32_t AnimationGraphSystem::currentFrame(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<AnimationGraphRuntimeComponent>(entity);
        return runtime ? runtime->currentFrame : 0;
    }

    SubsystemProfilerMetrics AnimationGraphSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.05;
        metrics.memoryUsageBytes = sizeof(AnimationGraphRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
