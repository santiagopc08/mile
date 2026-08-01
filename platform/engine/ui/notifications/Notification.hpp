#ifndef PLATFORM_ENGINE_UI_NOTIFICATIONS_NOTIFICATION_HPP
#define PLATFORM_ENGINE_UI_NOTIFICATIONS_NOTIFICATION_HPP

#include <string>
#include <glm/glm.hpp>

namespace platform
{
    enum class NotificationType
    {
        CoinCollected = 0,
        FuelLow,
        Checkpoint,
        Achievement, // reserved
        Mission      // reserved
    };

    enum class NotificationState
    {
        AnimateIn = 0,
        Visible,
        AnimateOut,
        Expired
    };

    struct Notification
    {
        NotificationType Type{NotificationType::CoinCollected};
        std::string Title{"Notification"};
        std::string Message;
        double DurationSeconds{2.5};
        double ElapsedSeconds{0.0};
        NotificationState State{NotificationState::AnimateIn};
        glm::vec4 Color{0.2f, 0.7f, 1.0f, 1.0f};

        double AnimInDuration{0.3};
        double AnimOutDuration{0.3};
    };
}

#endif // PLATFORM_ENGINE_UI_NOTIFICATIONS_NOTIFICATION_HPP
