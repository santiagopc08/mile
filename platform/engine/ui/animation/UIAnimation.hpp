#ifndef PLATFORM_ENGINE_UI_ANIMATION_UI_ANIMATION_HPP
#define PLATFORM_ENGINE_UI_ANIMATION_UI_ANIMATION_HPP

#include <glm/glm.hpp>
#include <algorithm>

namespace platform
{
    enum class AnimationType
    {
        Fade = 0,
        Scale,
        Slide,
        Opacity,
        Color
    };

    enum class EaseFunction
    {
        Linear = 0,
        EaseIn,
        EaseOut,
        EaseInOut
    };

    struct UIAnimation
    {
        AnimationType Type{AnimationType::Fade};
        EaseFunction Easing{EaseFunction::Linear};
        double DelaySeconds{0.0};
        double DurationSeconds{0.3};
        double ElapsedSeconds{0.0};
        bool Loop{false};
        bool Reverse{false};
        bool Active{true};

        glm::vec4 StartColor{1.0f};
        glm::vec4 TargetColor{1.0f};
        glm::vec2 StartVector{0.0f};
        glm::vec2 TargetVector{1.0f};

        [[nodiscard]] float CalculateProgress() const
        {
            if (ElapsedSeconds < DelaySeconds) return 0.0f;
            if (DurationSeconds <= 0.0) return 1.0f;

            double effectiveTime = ElapsedSeconds - DelaySeconds;
            float t = static_cast<float>(std::clamp(effectiveTime / DurationSeconds, 0.0, 1.0));

            switch (Easing)
            {
            case EaseFunction::EaseIn:
                return t * t;
            case EaseFunction::EaseOut:
                return t * (2.0f - t);
            case EaseFunction::EaseInOut:
                return t < 0.5f ? 2.0f * t * t : -1.0f + (4.0f - 2.0f * t) * t;
            case EaseFunction::Linear:
            default:
                return t;
            }
        }
    };
}

#endif // PLATFORM_ENGINE_UI_ANIMATION_UI_ANIMATION_HPP
