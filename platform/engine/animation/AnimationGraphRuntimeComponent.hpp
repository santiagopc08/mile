#ifndef PLATFORM_ENGINE_ANIMATION_ANIMATION_GRAPH_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_ANIMATION_ANIMATION_GRAPH_RUNTIME_COMPONENT_HPP

#include <string>
#include <unordered_map>
#include <variant>

namespace platform
{
    using AnimationStateID = std::string;
    using AnimParamValue = std::variant<bool, float, int>;

    struct AnimationGraphRuntimeComponent
    {
        AnimationStateID currentState{"Idle"};
        AnimationStateID previousState{"Idle"};
        float normalizedTime{0.0f};
        float stateTime{0.0f};
        bool transitionActive{false};
        uint32_t currentFrame{0};
        std::unordered_map<std::string, AnimParamValue> parameters;
    };
}

#endif // PLATFORM_ENGINE_ANIMATION_ANIMATION_GRAPH_RUNTIME_COMPONENT_HPP
