#ifndef PLATFORM_ENGINE_EVENTS_EVENT_TYPE_HPP
#define PLATFORM_ENGINE_EVENTS_EVENT_TYPE_HPP

namespace platform
{
    enum class EventType
    {
        None = 0,
        ApplicationStarted,
        ApplicationClosing,
        WindowCreated,
        WindowClosed,
        WindowResized,
        WindowMoved,
        WindowFocused,
        WindowLostFocus,
        WindowMinimized,
        WindowRestored,
        FrameStarted,
        FrameEnded,

        // Presentation Events (Milestone 9)
        ScreenChanged,
        WidgetFocused,
        ButtonPressed,
        NotificationShown,
        NotificationHidden,
        ThemeChanged,

        // Audio Events (Milestone 10)
        AudioVehicleStarted,
        AudioVehicleStopped,
        AudioJump,
        AudioLanding,
        AudioCoinCollected,
        AudioFuelCollected,
        AudioCheckpointReached,
        AudioVehicleReset,

        // Asset Events (Milestone 11)
        AssetImported,
        AssetReloaded,
        AssetUnloaded
    };
}

#endif // PLATFORM_ENGINE_EVENTS_EVENT_TYPE_HPP
