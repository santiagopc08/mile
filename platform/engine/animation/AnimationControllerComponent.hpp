#ifndef PLATFORM_ENGINE_ANIMATION_ANIMATION_CONTROLLER_COMPONENT_HPP
#define PLATFORM_ENGINE_ANIMATION_ANIMATION_CONTROLLER_COMPONENT_HPP

namespace platform
{
    struct AnimationControllerComponent
    {
        bool enabled{true};
        bool paused{false};
        float speedMultiplier{1.0f};
    };
}

#endif // PLATFORM_ENGINE_ANIMATION_ANIMATION_CONTROLLER_COMPONENT_HPP
