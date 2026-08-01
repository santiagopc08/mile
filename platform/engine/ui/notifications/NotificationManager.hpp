#ifndef PLATFORM_ENGINE_UI_NOTIFICATIONS_NOTIFICATION_MANAGER_HPP
#define PLATFORM_ENGINE_UI_NOTIFICATIONS_NOTIFICATION_MANAGER_HPP

#include "engine/ui/notifications/Notification.hpp"
#include "engine/ui/UIManager.hpp"
#include "engine/events/EventQueue.hpp"
#include <deque>
#include <vector>

namespace platform
{
    class NotificationManager
    {
    public:
        NotificationManager();

        bool Initialize(UIManager &uiManager, size_t maxSimultaneous = 3);
        void Push(Notification notification, EventQueue *eventQueue = nullptr);

        void Update(double dt, EventQueue *eventQueue = nullptr);
        void Render(Renderer &renderer);

        [[nodiscard]] size_t GetActiveCount() const { return m_activeNotifications.size(); }
        [[nodiscard]] size_t GetQueueDepth() const { return m_pendingQueue.size(); }
        void SetMaxSimultaneous(size_t max) { m_maxSimultaneous = max; }

    private:
        UIManager *m_uiManager{nullptr};
        Canvas *m_notificationCanvas{nullptr};
        size_t m_maxSimultaneous{3};

        std::deque<Notification> m_pendingQueue;
        std::vector<Notification> m_activeNotifications;
    };
}

#endif // PLATFORM_ENGINE_UI_NOTIFICATIONS_NOTIFICATION_MANAGER_HPP
