#ifndef PLATFORM_ENGINE_UI_SCREENS_SCREEN_TRANSITION_HPP
#define PLATFORM_ENGINE_UI_SCREENS_SCREEN_TRANSITION_HPP

#include <algorithm>

namespace platform
{
    enum class TransitionType
    {
        None = 0,
        FadeIn,
        FadeOut,
        Slide,  // reserved
        Zoom,   // reserved
        Custom  // reserved
    };

    struct ScreenTransition
    {
        TransitionType Type{TransitionType::None};
        double DurationSeconds{0.3};
        double ElapsedSeconds{0.0};
        bool Active{false};

        [[nodiscard]] float GetProgress() const
        {
            if (DurationSeconds <= 0.0) return 1.0f;
            return static_cast<float>(std::clamp(ElapsedSeconds / DurationSeconds, 0.0, 1.0));
        }
    };
}

#endif // PLATFORM_ENGINE_UI_SCREENS_SCREEN_TRANSITION_HPP
