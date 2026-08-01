#ifndef PLATFORM_ENGINE_INPUT_INPUT_STATE_HPP
#define PLATFORM_ENGINE_INPUT_INPUT_STATE_HPP

namespace platform
{
    /// Per-button state tracked across frames.
    enum class ButtonState : uint8_t
    {
        Idle = 0,   /// Not pressed, was not pressed last frame
        Pressed,    /// Became pressed this frame
        Held,       /// Was pressed last frame and still pressed
        Released    /// Was pressed last frame, released this frame
    };
}

#endif // PLATFORM_ENGINE_INPUT_INPUT_STATE_HPP
