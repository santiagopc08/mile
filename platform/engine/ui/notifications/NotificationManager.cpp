#include "engine/ui/notifications/NotificationManager.hpp"
#include "engine/ui/events/PresentationEvents.hpp"
#include "engine/graphics/RenderCommand.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    NotificationManager::NotificationManager() = default;

    bool NotificationManager::Initialize(UIManager &uiManager, size_t maxSimultaneous)
    {
        m_uiManager = &uiManager;
        m_maxSimultaneous = maxSimultaneous;

        m_notificationCanvas = uiManager.CreateCanvas("NotificationCanvas", UILayer::Notification);
        if (!m_notificationCanvas)
        {
            LOG_ERROR("[NotificationManager] Failed to create notification canvas.");
            return false;
        }

        LOG_INFO("[NotificationManager] Notification system initialized.");
        return true;
    }

    void NotificationManager::Push(Notification notification, EventQueue *eventQueue)
    {
        m_pendingQueue.push_back(notification);
        if (eventQueue)
        {
            eventQueue->Push(std::make_shared<NotificationShownEvent>(notification.Title));
        }
    }

    void NotificationManager::Update(double dt, EventQueue *eventQueue)
    {
        // 1. Move pending to active if slot available
        while (m_activeNotifications.size() < m_maxSimultaneous && !m_pendingQueue.empty())
        {
            m_activeNotifications.push_back(m_pendingQueue.front());
            m_pendingQueue.pop_front();
        }

        // 2. Update active notifications lifecycle
        for (auto it = m_activeNotifications.begin(); it != m_activeNotifications.end();)
        {
            it->ElapsedSeconds += dt;

            if (it->State == NotificationState::AnimateIn)
            {
                if (it->ElapsedSeconds >= it->AnimInDuration)
                {
                    it->State = NotificationState::Visible;
                }
                ++it;
            }
            else if (it->State == NotificationState::Visible)
            {
                if (it->ElapsedSeconds >= (it->DurationSeconds - it->AnimOutDuration))
                {
                    it->State = NotificationState::AnimateOut;
                }
                ++it;
            }
            else if (it->State == NotificationState::AnimateOut)
            {
                if (it->ElapsedSeconds >= it->DurationSeconds)
                {
                    it->State = NotificationState::Expired;
                    if (eventQueue)
                    {
                        eventQueue->Push(std::make_shared<NotificationHiddenEvent>(it->Title));
                    }
                    it = m_activeNotifications.erase(it);
                }
                else
                {
                    ++it;
                }
            }
            else
            {
                it = m_activeNotifications.erase(it);
            }
        }
    }

    void NotificationManager::Render(Renderer &renderer)
    {
        float yPos = 60.0f; // Start below top HUD bar
        for (const auto &n : m_activeNotifications)
        {
            float alpha = 1.0f;
            if (n.State == NotificationState::AnimateIn)
            {
                alpha = static_cast<float>(n.ElapsedSeconds / n.AnimInDuration);
            }
            else if (n.State == NotificationState::AnimateOut)
            {
                double remaining = n.DurationSeconds - n.ElapsedSeconds;
                alpha = static_cast<float>(remaining / n.AnimOutDuration);
            }

            alpha = glm::clamp(alpha, 0.0f, 1.0f);
            glm::vec4 bannerColor = n.Color;
            bannerColor.a *= alpha;

            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                glm::vec2(440.0f, yPos),
                glm::vec2(400.0f, 40.0f),
                0.0f,
                bannerColor
            ));

            yPos += 50.0f;
        }
    }
}
